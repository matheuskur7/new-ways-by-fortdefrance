import { ConfigService } from '@nestjs/config';
import { auditArguments } from '../../../../src/shared/audit/audit-extension.js';
import {
  getAuditActor,
  runWithAuditActor,
} from '../../../../src/shared/audit/audit-context.js';
import { PrismaService } from '../../../../src/shared/db/prisma.service.js';
import { CustomerRepository } from '../../../../src/modules/customer/customer.repository.js';

describe('Session audit arguments', () => {
  it.each([
    'User',
    'Organization',
    'Member',
    'Invitation',
    'Customer',
    'Image',
    'CardFeeGroup',
    'CardFee',
  ])('stamps server-controlled creation metadata for %s', (model) => {
    const result = auditArguments(
      model,
      'create',
      {
        data: {
          id: 'record',
          name: 'Original',
          createdBy: 'forged',
          updatedBy: 'forged',
          creator: { connect: { id: 'forged' } },
          updater: { connect: { id: 'forged' } },
          createdAt: new Date(0),
        },
      },
      'alice',
    );
    expect(result.data).toEqual({
      id: 'record',
      name: 'Original',
      createdBy: 'alice',
      updatedBy: 'alice',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('preserves the original author and creation timestamp on updates and blocks relation impersonation', () => {
    const result = auditArguments(
      'Customer',
      'update',
      {
        where: { id: 'id' },
        data: {
          name: 'Novo',
          createdBy: { set: 'mallory' },
          createdAt: new Date(0),
          updatedBy: 'mallory',
          creator: { connect: { id: 'mallory' } },
        },
      },
      'bob',
    );
    expect(result).toEqual({
      where: { id: 'id' },
      data: { name: 'Novo', updatedBy: 'bob', updatedAt: expect.any(Date) },
    });
  });

  it('blocks rewriting authors through inverse user relations', () => {
    const result = auditArguments(
      'User',
      'update',
      {
        data: {
          name: 'Alice',
          createdImages: { connect: { id: 'image' } },
          updatedCustomers: { set: [{ id: 'customer' }] },
        },
      },
      'alice',
    );
    expect(result.data).toEqual({
      name: 'Alice',
      updatedBy: 'alice',
      updatedAt: expect.any(Date),
    });
  });

  it('allows forward connections and rejects inverse connections that would silently change another row', () => {
    expect(
      auditArguments(
        'Member',
        'create',
        { data: { organization: { connect: { id: 'company' } } } },
        'alice',
      ),
    ).toMatchObject({
      data: {
        organization: { connect: { id: 'company' } },
        createdBy: 'alice',
      },
    });
    for (const operation of ['connect', 'disconnect', 'set']) {
      expect(() =>
        auditArguments(
          'Organization',
          'update',
          { data: { members: { [operation]: { id: 'member' } } } },
          'alice',
        ),
      ).toThrow('preservar a auditoria');
    }
  });

  it('stamps nested rates inside a group, including nested bulk creation', () => {
    const result = auditArguments(
      'CardFeeGroup',
      'create',
      {
        data: {
          name: 'Cartões',
          rates: {
            create: [{ installments: 1, createdBy: 'mallory' }],
            createMany: { data: [{ installments: 2 }], skipDuplicates: true },
          },
        },
      },
      'alice',
    );
    expect(result.data).toMatchObject({
      createdBy: 'alice',
      updatedBy: 'alice',
      rates: {
        create: [{ installments: 1, createdBy: 'alice', updatedBy: 'alice' }],
        createMany: {
          data: [{ installments: 2, createdBy: 'alice', updatedBy: 'alice' }],
          skipDuplicates: true,
        },
      },
    });
  });

  it('stamps nested updates, upserts and connect-or-create without changing their predicates', () => {
    const result = auditArguments(
      'Organization',
      'update',
      {
        data: {
          members: {
            update: {
              where: { id: 'member' },
              data: { role: 'admin', createdBy: 'mallory' },
            },
            updateMany: [
              { where: { role: 'member' }, data: { role: 'admin' } },
            ],
            upsert: {
              where: { id: 'other' },
              create: { role: 'member' },
              update: { role: 'admin' },
            },
            connectOrCreate: {
              where: { id: 'new' },
              create: { role: 'member' },
            },
          },
        },
      },
      'alice',
    );
    expect(result.data).toMatchObject({
      members: {
        update: {
          where: { id: 'member' },
          data: { role: 'admin', updatedBy: 'alice' },
        },
        updateMany: [
          {
            where: { role: 'member' },
            data: { role: 'admin', updatedBy: 'alice' },
          },
        ],
        upsert: {
          where: { id: 'other' },
          create: { createdBy: 'alice' },
          update: { updatedBy: 'alice' },
        },
        connectOrCreate: {
          where: { id: 'new' },
          create: { createdBy: 'alice' },
        },
      },
    });
  });

  it.each(['createMany', 'createManyAndReturn'])(
    'stamps each row in %s',
    (operation) => {
      const result = auditArguments(
        'Image',
        operation,
        { data: [{ key: 'a' }, { key: 'b' }], skipDuplicates: true },
        'alice',
      );
      expect(result).toMatchObject({
        data: [
          { key: 'a', createdBy: 'alice' },
          { key: 'b', createdBy: 'alice' },
        ],
        skipDuplicates: true,
      });
    },
  );

  it.each(['updateMany', 'updateManyAndReturn'])(
    'stamps bulk changes with %s',
    (operation) => {
      expect(
        auditArguments(
          'CardFee',
          operation,
          { where: { groupId: 'group' }, data: { ratePercent: '1.00' } },
          'bob',
        ),
      ).toMatchObject({
        where: { groupId: 'group' },
        data: { ratePercent: '1.00', updatedBy: 'bob' },
      });
    },
  );

  it('keeps system seeds unattributed and preserves a no-op upsert update', () => {
    const result = auditArguments(
      'CardFeeGroup',
      'upsert',
      {
        where: { seedKey: 'cards' },
        update: {},
        create: { name: 'Cartões', rates: { create: [{ installments: 1 }] } },
      },
      null,
    );
    expect(result).toMatchObject({
      update: {},
      create: {
        createdBy: null,
        updatedBy: null,
        rates: { create: [{ createdBy: null, updatedBy: null }] },
      },
    });
  });

  it('attributes self-registration to the server-generated user identity', () => {
    expect(
      auditArguments('User', 'create', { data: { id: 'new-user' } }, null),
    ).toMatchObject({ data: { createdBy: 'new-user', updatedBy: 'new-user' } });
  });

  it.each(['Session', 'Account', 'Verification'])(
    'leaves authentication internals unchanged for %s',
    (model) => {
      const args = { data: { userId: 'alice', token: 'test-token' } };
      expect(auditArguments(model, 'create', args, 'bob')).toEqual(args);
    },
  );

  it('does not mutate caller objects or touch reads and deletes', () => {
    const args = { data: { name: 'Original', createdBy: 'forged' } };
    auditArguments('Customer', 'create', args, 'alice');
    expect(args.data.createdBy).toBe('forged');
    const where = { where: { id: 'id' } };
    expect(auditArguments('Image', 'delete', where, 'alice')).toBe(where);
    expect(auditArguments('User', 'findUnique', where, 'alice')).toBe(where);
  });
});

describe('Audit context isolation', () => {
  it('keeps actors isolated across asynchronous concurrent operations', async () => {
    const values = await Promise.all(
      ['alice', 'bob'].map((actor) =>
        runWithAuditActor(actor, async () => {
          await Promise.resolve();
          return getAuditActor();
        }),
      ),
    );
    expect(values).toEqual(['alice', 'bob']);
    expect(getAuditActor()).toBeNull();
  });
});

describe('PrismaService audit extension (database execution mocked)', () => {
  it('applies the extension before executing Prisma queries and preserves lifecycle cleanup', async () => {
    const prisma = new PrismaService(
      new ConfigService({
        DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test',
      }),
    );
    let captured: unknown;
    const client = prisma.$extends({
      query: {
        $allModels: {
          $allOperations({ args }) {
            captured = args;
            return Promise.resolve({ id: 'mocked' });
          },
        },
      },
    });
    try {
      await runWithAuditActor('alice', () =>
        client.image.create({
          data: { tag: 'car-image', key: 'car-image/test' },
        }),
      );
      expect(captured).toMatchObject({
        data: { createdBy: 'alice', updatedBy: 'alice' },
      });
      const repository = new CustomerRepository(
        client as unknown as PrismaService,
      );
      const dto = {
        name: 'Cliente',
        cpfCnpj: '12345678901',
        phone: '11999999999',
        type: 'PERSON' as const,
      };
      await runWithAuditActor('alice', () =>
        repository.create('company-a', dto),
      );
      expect(captured).toMatchObject({
        data: {
          ...dto,
          organizationId: 'company-a',
          createdBy: 'alice',
          updatedBy: 'alice',
        },
      });
      await repository.create('company-a', dto);
      expect(captured).toMatchObject({
        data: {
          ...dto,
          organizationId: 'company-a',
          createdBy: null,
          updatedBy: null,
        },
      });
      expect(typeof prisma.onModuleDestroy).toBe('function');
    } finally {
      await prisma.onModuleDestroy();
    }
  });
});
