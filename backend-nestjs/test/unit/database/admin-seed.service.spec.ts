import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSeedService } from '../../../src/shared/database/admin-seed.service.js';
import { DatabaseService } from '../../../src/shared/database/database.service.js';
import type { Environment } from '../../../src/shared/config/env.js';

vi.mock('better-auth/crypto', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}));

describe('AdminSeedService', () => {
  const returning = vi.fn();
  const values = vi.fn();
  const insert = vi.fn(() => ({ values }));
  const transaction = vi.fn(async (callback) => callback({ insert }));
  const config = new ConfigService<Environment, true>({
    ADMIN_USER_NAME: 'Admin',
    ADMIN_USER_EMAIL: 'ADMIN@example.com',
    ADMIN_USER_PASSWORD: 'example-password',
  });
  const service = new AdminSeedService(config, {
    db: { transaction },
  } as unknown as DatabaseService);

  beforeEach(() => {
    vi.clearAllMocks();
    values.mockReturnValue({ onConflictDoNothing: () => ({ returning }) });
  });

  it('cria usuário e credencial com hash na mesma transação', async () => {
    returning.mockResolvedValue([{ id: 'user-id' }]);
    await expect(service.run()).resolves.toBe(true);
    expect(values).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ email: 'admin@example.com' }),
    );
    expect(values).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 'user-id',
        accountId: 'user-id',
        providerId: 'credential',
        password: 'hashed-password',
      }),
    );
    expect(transaction).toHaveBeenCalledOnce();
  });

  it('preserva a conta existente sem inserir outra credencial', async () => {
    returning.mockResolvedValue([]);
    await expect(service.run()).resolves.toBe(false);
    expect(insert).toHaveBeenCalledOnce();
  });

  it('rejeita configuração incompleta antes de acessar o banco', async () => {
    const invalid = new AdminSeedService(new ConfigService<Environment, true>({}), {
      db: { transaction },
    } as unknown as DatabaseService);
    await expect(invalid.run()).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });
});
