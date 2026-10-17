import { validateSync } from 'class-validator';
import { CreateOrganizationDto } from '../organization/dto/create-organization.dto.js';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import type { EmailService } from '../../shared/email/email.service.js';
import { organization } from 'better-auth/plugins';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../shared/db/prisma.service.js';

export function getAuthOptions(
  config: ConfigService,
  email: Pick<EmailService, 'sendAuthenticationEmail'> &
    Partial<Pick<EmailService, 'sendOrganizationInvitationEmail'>>,
  registeredUserExists: (email: string) => Promise<boolean> = async () => false,
) {
  const secret = config.getOrThrow<string>('BETTER_AUTH_SECRET');
  if (secret.length < 32 || secret.startsWith('replace-with-')) {
    throw new Error(
      'BETTER_AUTH_SECRET deve ser um segredo aleatório de pelo menos 32 caracteres.',
    );
  }
  const frontendURL = new URL(config.getOrThrow<string>('FRONTEND_URL')).origin;
  const requireRegisteredUser = async (address: string) => {
    if (!(await registeredUserExists(address.trim().toLowerCase()))) {
      throw new APIError('BAD_REQUEST', {
        message: 'O e-mail informado precisa ter cadastro ativo no sistema.',
      });
    }
  };
  const organizationPlugin = organization({
    requireEmailVerificationOnInvitation: true,
    invitationExpiresIn: 48 * 3600,
    organizationHooks: {
      beforeCreateOrganization: async ({ organization: company }) => {
        const input = Object.assign(new CreateOrganizationDto(), {
          name: company.name?.trim(),
          slug: company.slug?.trim(),
        });
        if (validateSync(input).length)
          throw new APIError('BAD_REQUEST', {
            message: 'Informe um nome e um código de empresa válidos.',
          });
        return { data: { name: input.name, slug: input.slug } };
      },
      beforeUpdateOrganization: async ({ organization: company }) => {
        const input = Object.assign(new CreateOrganizationDto(), {
          name: company.name?.trim(),
          slug: company.slug?.trim(),
        });
        if (validateSync(input, { skipMissingProperties: true }).length)
          throw new APIError('BAD_REQUEST', {
            message: 'Informe um nome e um código de empresa válidos.',
          });
        return {
          data: {
            ...company,
            ...(company.name !== undefined ? { name: input.name } : {}),
            ...(company.slug !== undefined ? { slug: input.slug } : {}),
          },
        };
      },
      beforeCreateInvitation: async ({ invitation }) => {
        await requireRegisteredUser(invitation.email);
      },
    },
    sendInvitationEmail: async ({
      email: address,
      organization: company,
      id,
    }) => {
      // Resends do not pass through beforeCreateInvitation.
      await requireRegisteredUser(address);
      if (!email.sendOrganizationInvitationEmail)
        throw new APIError('SERVICE_UNAVAILABLE', {
          message: 'Envio de convites indisponível.',
        });
      try {
        await email.sendOrganizationInvitationEmail(address, company.name, id);
      } catch {
        throw new APIError('SERVICE_UNAVAILABLE', {
          message:
            'Não foi possível enviar o e-mail. O convite foi salvo; tente reenviar.',
        });
      }
    },
  });
  return {
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (
          context.path === '/organization/invite-member' &&
          typeof context.body?.email === 'string'
        ) {
          await requireRegisteredUser(context.body.email);
        }
      }),
    },
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
  email: Pick<
    EmailService,
    'sendAuthenticationEmail' | 'sendOrganizationInvitationEmail'
  >,
) {
  return betterAuth({
    ...getAuthOptions(config, email, async (address) =>
      Boolean(
        await prisma.user.findUnique({
          where: { email: address },
          select: { id: true },
        }),
      ),
    ),
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
      transaction: true,
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
