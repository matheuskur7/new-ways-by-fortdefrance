import { Prisma } from '../../generated/prisma/client.js';

const filteredOperations = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
]);

// Also filter Session: Better Auth may load its user through a relation join.
export const userSoftDeleteExtension = Prisma.defineExtension({
  name: 'active-users',
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        if (
          model === 'User' &&
          ['delete', 'deleteMany', 'upsert'].includes(operation)
        ) {
          throw new Error(
            'Use UserService.softDelete para excluir usuários; exclusão física e upsert não são permitidos.',
          );
        }
        if (
          (model === 'User' || model === 'Session') &&
          filteredOperations.has(operation)
        ) {
          const input = args as { where?: Record<string, unknown> };
          const active =
            model === 'User'
              ? { deletedAt: null }
              : { user: { is: { deletedAt: null } } };
          return query({
            ...args,
            where: { ...input.where, AND: [input.where ?? {}, active] },
          } as typeof args);
        }
        return query(args);
      },
    },
  },
});
