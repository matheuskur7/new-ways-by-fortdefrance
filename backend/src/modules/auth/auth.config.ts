import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { organization } from 'better-auth/plugins';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../shared/db/prisma.service.js';

export function getAuthOptions(config: ConfigService) {
  const secret = config.getOrThrow<string>('BETTER_AUTH_SECRET');
  if (secret.length < 32 || secret.startsWith('replace-with-')) {
    throw new Error(
      'BETTER_AUTH_SECRET deve ser um segredo aleatório de pelo menos 32 caracteres.',
    );
  }
  const frontendURL = new URL(config.getOrThrow<string>('FRONTEND_URL')).origin;
  const organizationPlugin = organization();
  return {
    appName: 'New Ways',
    baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'),
    basePath: '/api/auth',
    secret,
    trustedOrigins: [frontendURL],
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: { cookieCache: { enabled: false } },
    plugins: [organizationPlugin] as [typeof organizationPlugin],
  };
}

export function createAuth(prisma: PrismaService, config: ConfigService) {
  return betterAuth({
    ...getAuthOptions(config),
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
      transaction: true,
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
