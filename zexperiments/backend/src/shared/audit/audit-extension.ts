import { Prisma } from '../../generated/prisma/client.js';
import { getAuditActor } from './audit-context.js';

const auditedModels = new Set([
  'User',
  'Organization',
  'Member',
  'Invitation',
  'Customer',
  'Image',
  'CardFeeGroup',
  'CardFee',
]);

// Query extensions do not receive nested writes as separate operations.
// Traverse the current application's writable relations explicitly.
const relations: Record<string, Record<string, string>> = {
  User: {
    sessions: 'Session',
    accounts: 'Account',
    memberships: 'Member',
    invitations: 'Invitation',
    createdCustomers: 'Customer',
    updatedCustomers: 'Customer',
    createdUsers: 'User',
    updatedUsers: 'User',
    createdOrganizations: 'Organization',
    updatedOrganizations: 'Organization',
    createdMembers: 'Member',
    updatedMembers: 'Member',
    createdInvitations: 'Invitation',
    updatedInvitations: 'Invitation',
    createdImages: 'Image',
    updatedImages: 'Image',
    createdCardFeeGroups: 'CardFeeGroup',
    updatedCardFeeGroups: 'CardFeeGroup',
    createdCardFees: 'CardFee',
    updatedCardFees: 'CardFee',
  },
  Organization: {
    members: 'Member',
    invitations: 'Invitation',
    customers: 'Customer',
  },
  Member: { user: 'User', organization: 'Organization' },
  Invitation: { inviter: 'User', organization: 'Organization' },
  Customer: { organization: 'Organization' },
  CardFeeGroup: { rates: 'CardFee' },
  CardFee: { group: 'CardFeeGroup' },
  Session: { user: 'User' },
  Account: { user: 'User' },
};

const inverseRelations: Record<string, Set<string>> = {
  User: new Set(['memberships', 'invitations']),
  Organization: new Set(['members', 'invitations', 'customers']),
  CardFeeGroup: new Set(['rates']),
};

type Input = Record<string, unknown>;

function isRecord(value: unknown): value is Input {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapMany(value: unknown, map: (input: Input) => Input): unknown {
  if (Array.isArray(value))
    return value.map((item) => (isRecord(item) ? map(item) : item));
  return isRecord(value) ? map(value) : value;
}

function stamp(
  model: string,
  input: Input,
  mode: 'create' | 'update',
  actorId: string | null,
): Input {
  const data = { ...input };
  if (auditedModels.has(model)) {
    // Neither scalar author IDs nor relation writes can impersonate an actor.
    delete data.creator;
    delete data.updater;
    delete data.createdBy;
    delete data.updatedBy;
    if (model === 'User') {
      // Inverse links can also rewrite another row's creator/editor via connect/set.
      for (const field of Object.keys(relations.User)) {
        if (field.startsWith('created') || field.startsWith('updated'))
          delete data[field];
      }
    }
    const actor =
      actorId ??
      (model === 'User' && mode === 'create' && typeof data.id === 'string'
        ? data.id
        : null);
    if (mode === 'create') {
      data.createdBy = actor;
      data.createdAt = new Date();
    } else {
      delete data.createdAt;
    }
    data.updatedBy = actor;
    data.updatedAt = new Date();
  }
  for (const [field, target] of Object.entries(relations[model] ?? {})) {
    const relationWrite = data[field];
    if (isRecord(relationWrite)) {
      if (
        inverseRelations[model]?.has(field) &&
        ['connect', 'disconnect', 'set'].some(
          (operation) => operation in relationWrite,
        )
      ) {
        // These operations modify a child FK without accepting child audit data.
        throw new Error(
          `Atualize o vínculo em ${target} diretamente para preservar a auditoria.`,
        );
      }
      data[field] = transformWrite(target, relationWrite, actorId);
    }
  }
  return data;
}

function update(model: string, input: Input, actor: string | null): Input {
  // Preserve no-op seed upserts instead of inventing a modification.
  return Object.keys(input).length
    ? stamp(model, input, 'update', actor)
    : input;
}

function transformWrite(
  model: string,
  input: Input,
  actor: string | null,
): Input {
  const result = { ...input };
  for (const operation of [
    'create',
    'createMany',
    'createManyAndReturn',
    'connectOrCreate',
    'upsert',
    'update',
    'updateMany',
    'updateManyAndReturn',
  ]) {
    if (!(operation in input)) continue;
    result[operation] = mapMany(input[operation], (item) => {
      if (operation === 'create') return stamp(model, item, 'create', actor);
      if (operation === 'connectOrCreate')
        return {
          ...item,
          create: isRecord(item.create)
            ? stamp(model, item.create, 'create', actor)
            : item.create,
        };
      if (operation === 'upsert')
        return {
          ...item,
          create: isRecord(item.create)
            ? stamp(model, item.create, 'create', actor)
            : item.create,
          update: isRecord(item.update)
            ? update(model, item.update, actor)
            : item.update,
        };
      if ('data' in item)
        return {
          ...item,
          data: mapMany(item.data, (data) =>
            operation.startsWith('create')
              ? stamp(model, data, 'create', actor)
              : update(model, data, actor),
          ),
        };
      return update(model, item, actor);
    });
  }
  return result;
}

export function auditArguments(
  model: string,
  operation: string,
  args: Input,
  actorId: string | null,
): Input {
  if (operation === 'upsert')
    return transformWrite(model, { upsert: args }, actorId).upsert as Input;
  if (operation.startsWith('create') || operation.startsWith('update')) {
    return {
      ...args,
      data: mapMany(args.data, (data) =>
        operation.startsWith('create')
          ? stamp(model, data, 'create', actorId)
          : update(model, data, actorId),
      ),
    };
  }
  return args;
}

export const auditExtension = Prisma.defineExtension({
  name: 'session-audit',
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        return query(
          auditArguments(
            model,
            operation,
            args,
            getAuditActor(),
          ) as typeof args,
        );
      },
    },
  },
});
