import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import type { EmailService } from '../../shared/email/email.service.js';
import { organization } from 'better-auth/plugins';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../shared/db/prisma.service.js';

export function getAuthOptions(
  config: ConfigService,
  email: Pick<EmailService, 'sendAuthenticationEmail'>,
) {
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
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 3600,
      sendResetPassword: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        email.sendAuthenticationEmail('password-reset', user.email, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        email.sendAuthenticationEmail('verification', user.email, url);
      },
    },
    rateLimit: {
      enabled: true,
      customRules: {
        '/send-verification-email': { window: 60, max: 3 },
        '/request-password-reset': { window: 60, max: 3 },
        '/reset-password': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
      },
    },
    session: {
      expiresIn: 12 * 3600,
      updateAge: 3 * 3600,
      cookieCache: { enabled: false },
    },
    plugins: [organizationPlugin] as [typeof organizationPlugin],
  };
}

export function createAuth(
  prisma: PrismaService,
  config: ConfigService,
  email: Pick<EmailService, 'sendAuthenticationEmail'>,
) {
  return betterAuth({
    ...getAuthOptions(config, email),
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
      transaction: true,
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
