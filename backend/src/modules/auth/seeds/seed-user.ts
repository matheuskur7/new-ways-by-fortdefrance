import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  validateSync,
} from 'class-validator';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../../shared/db/prisma.service.js';
import type { Auth } from '../auth.config.js';

export class SeedUserInput {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export function getSeedUserInput(config: ConfigService): SeedUserInput {
  const input = Object.assign(new SeedUserInput(), {
    name: config.getOrThrow<string>('ADMIN_USER_NAME').trim(),
    email: config.getOrThrow<string>('ADMIN_USER_EMAIL').trim().toLowerCase(),
    password: config.getOrThrow<string>('ADMIN_USER_PASSWORD'),
  });
  if (validateSync(input).length) {
    // Do not include validation objects: they contain the password.
    throw new Error(
      'Configure ADMIN_USER_NAME, ADMIN_USER_EMAIL e ADMIN_USER_PASSWORD (8 a 128 caracteres) com valores válidos.',
    );
  }
  return input;
}

/** Repetir o seed nunca troca dados ou senha de uma conta existente. */
export async function seedUser(
  prisma: PrismaService,
  auth: Auth,
  input: SeedUserInput,
) {
  if (validateSync(Object.assign(new SeedUserInput(), input)).length) {
    throw new Error('Dados inválidos para o usuário inicial.');
  }
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      accounts: {
        where: { providerId: 'credential', password: { not: null } },
        select: { id: true },
      },
    },
  });
  if (existing) {
    if (!existing.accounts.length)
      throw new Error(
        'O e-mail do seed pertence a uma conta sem senha. Nenhum dado foi alterado.',
      );
    return { created: false };
  }
  // Better Auth creates the credential account and hashes the password.
  await auth.api.signUpEmail({
    body: { name: input.name, email: input.email, password: input.password },
  });
  return { created: true };
}
