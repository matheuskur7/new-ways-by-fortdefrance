import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../../../src/modules/user/user.repository.js';
import { UserService } from '../../../../src/modules/user/user.service.js';
import { UserController } from '../../../../src/modules/user/user.controller.js';
import type { AuthService } from '../../../../src/modules/auth/auth.service.js';
import type { AuthenticatedRequest } from '../../../../src/modules/auth/auth.guard.js';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';

describe('User soft delete (mocked database and password verification)', () => {
  const transaction = {
    user: { updateMany: vi.fn() },
    session: { deleteMany: vi.fn() },
  };
  const prisma = {
    $transaction: vi.fn(
      async (operation: (tx: typeof transaction) => unknown) =>
        operation(transaction),
    ),
  };
  const service = new UserService(
    new UserRepository(prisma as unknown as PrismaService),
  );
  const verifyPassword = vi.fn();
  const controller = new UserController(service, {
    auth: { api: { verifyPassword } },
  } as unknown as AuthService);
  const request = {
    headers: { cookie: 'session=alice' },
    authSession: { user: { id: 'alice' } },
  } as unknown as AuthenticatedRequest;
  beforeEach(() => {
    vi.clearAllMocks();
    verifyPassword.mockResolvedValue({ status: true });
    transaction.user.updateMany.mockResolvedValue({ count: 1 });
  });
  it('marks only the session owner as deleted and revokes every session in the same transaction', async () => {
    await expect(
      controller.deleteAccount(request, { password: 'password' }),
    ).resolves.toEqual({ success: true });
    expect(verifyPassword).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: { password: 'password' },
    });
    expect(transaction.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'alice', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
    expect(transaction.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'alice' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
  it('does not delete when password verification fails', async () => {
    verifyPassword.mockRejectedValueOnce(new Error('Invalid password'));
    await expect(
      controller.deleteAccount(request, { password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('does not restamp an already deleted account', async () => {
    transaction.user.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.softDelete('alice')).rejects.toThrow(
      NotFoundException,
    );
  });
  it('propagates session revocation failures so the transaction can roll back', async () => {
    transaction.session.deleteMany.mockRejectedValueOnce(
      new Error('Database failure'),
    );
    await expect(service.softDelete('alice')).rejects.toThrow(
      'Database failure',
    );
  });
});
