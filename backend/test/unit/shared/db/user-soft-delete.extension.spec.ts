import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../src/shared/db/prisma.service.js';

describe('Soft delete filters (Prisma execution mocked)', () => {
  it('filters users and joined sessions, blocks physical deletion and preserves audit stamping', async () => {
    const prisma = new PrismaService(
      new ConfigService({
        DATABASE_URL: 'postgresql://test:test@localhost/test',
      }),
    );
    const calls: { model: string; operation: string; args: unknown }[] = [];
    const client = prisma.$extends({
      query: {
        $allModels: {
          $allOperations({ model, operation, args }) {
            calls.push({ model, operation, args });
            return Promise.resolve(null);
          },
        },
      },
    });
    try {
      await client.user.findUnique({ where: { email: 'user@example.com' } });
      expect(calls.at(-1)?.args).toMatchObject({
        where: {
          email: 'user@example.com',
          AND: [{ email: 'user@example.com' }, { deletedAt: null }],
        },
      });
      await client.user.findMany({
        where: { OR: [{ name: 'Test' }, { deletedAt: { not: null } }] },
      });
      expect(calls.at(-1)?.args).toMatchObject({
        where: { AND: [expect.anything(), { deletedAt: null }] },
      });
      await client.session.findUnique({
        where: { token: 'old-cookie' },
        include: { user: true },
      });
      expect(calls.at(-1)?.args).toMatchObject({
        where: {
          token: 'old-cookie',
          AND: [expect.anything(), { user: { is: { deletedAt: null } } }],
        },
      });
      await client.user.updateMany({
        where: { id: 'alice' },
        data: { deletedAt: new Date() },
      });
      expect(calls.at(-1)?.args).toMatchObject({
        where: { AND: [expect.anything(), { deletedAt: null }] },
        data: {
          deletedAt: expect.any(Date),
          updatedBy: null,
          updatedAt: expect.any(Date),
        },
      });
      await expect(
        client.user.delete({ where: { id: 'alice' } }),
      ).rejects.toThrow('UserService.softDelete');
      await expect(client.user.deleteMany({})).rejects.toThrow(
        'UserService.softDelete',
      );
      await client.session.deleteMany({ where: { userId: 'alice' } });
      expect(calls.at(-1)?.args).toEqual({ where: { userId: 'alice' } });
    } finally {
      await prisma.onModuleDestroy();
    }
  });
});
