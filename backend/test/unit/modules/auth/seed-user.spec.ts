import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';
import type { Auth } from '../../../../src/modules/auth/auth.config.js';
import {
  getSeedUserInput,
  seedUser,
  SeedUserInput,
} from '../../../../src/modules/auth/seeds/seed-user.js';

const input = Object.assign(new SeedUserInput(), {
  name: 'Admin de teste',
  email: 'admin@example.com',
  password: 'senha-de-teste-123',
});
function setup(existing: unknown = null) {
  const findUnique = vi.fn().mockResolvedValue(existing);
  const signUpEmail = vi.fn().mockResolvedValue({ user: { id: 'user' } });
  return {
    findUnique,
    signUpEmail,
    prisma: { user: { findUnique } } as unknown as PrismaService,
    auth: { api: { signUpEmail } } as unknown as Auth,
  };
}

it('creates initial credentials through Better Auth using the configured password', async () => {
  const { prisma, auth, signUpEmail } = setup();
  expect(await seedUser(prisma, auth, input)).toEqual({ created: true });
  expect(signUpEmail).toHaveBeenCalledWith({ body: input });
});
it('preserves existing user data and password on repeated execution', async () => {
  const { prisma, auth, signUpEmail } = setup({
    id: 'user',
    accounts: [{ id: 'account' }],
  });
  expect(await seedUser(prisma, auth, input)).toEqual({ created: false });
  expect(signUpEmail).not.toHaveBeenCalled();
});
it('rejects a conflicting account without password without modifying it', async () => {
  const { prisma, auth, signUpEmail } = setup({ id: 'user', accounts: [] });
  await expect(seedUser(prisma, auth, input)).rejects.toThrow(
    'conta sem senha',
  );
  expect(signUpEmail).not.toHaveBeenCalled();
});
it('rejects invalid environment values without including the secret in diagnostics', () => {
  const config = new ConfigService({
    ADMIN_USER_NAME: ' Admin ',
    ADMIN_USER_EMAIL: ' ADMIN@EXAMPLE.COM ',
    ADMIN_USER_PASSWORD: 'short',
  });
  expect(() => getSeedUserInput(config)).toThrow('8 a 128 caracteres');
  try {
    getSeedUserInput(config);
  } catch (error) {
    expect(String(error)).not.toContain('short');
  }
});
it('normalizes name and email without trimming the password', () => {
  const config = new ConfigService({
    ADMIN_USER_NAME: ' Admin ',
    ADMIN_USER_EMAIL: ' ADMIN@EXAMPLE.COM ',
    ADMIN_USER_PASSWORD: ' password ',
  });
  expect(getSeedUserInput(config)).toEqual({
    name: 'Admin',
    email: 'admin@example.com',
    password: ' password ',
  });
});
