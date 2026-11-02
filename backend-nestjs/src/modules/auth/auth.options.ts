import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BetterAuthOptions } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { openAPI, organization } from 'better-auth/plugins';
import { organizationDetailsSchema } from '../organization/dto/organization-details.dto.js';
import type { Environment } from '../../shared/config/env.js';
import {
  EMAIL_VERIFICATION_TTL_SECONDS,
  PASSWORD_RESET_TTL_SECONDS,
} from './auth-emails.service.js';
import type { AuthEmailSender } from './auth-emails.service.js';

const logger = new Logger('AuthEmails');

/**
 * Envia sem aguardar: o tempo de resposta não revela se o e-mail existe.
 * Falhas são registradas sem destinatário, token, link ou detalhes do SMTP.
 */
function sendInBackground(description: string, send: () => Promise<void>) {
  void send().catch(() => logger.error(`Não foi possível enviar o e-mail de ${description}.`));
}

function validateOrganizationDetails(data: unknown) {
  const parsed = organizationDetailsSchema.partial().safeParse(data);
  if (!parsed.success) {
    throw new APIError('BAD_REQUEST', {
      code: 'INVALID_ORGANIZATION_DETAILS',
      message: 'Informe dados válidos para a empresa.',
    });
  }
  return parsed.data;
}

export function createAuthOptions(
  config: ConfigService<Environment, true>,
  emails: AuthEmailSender,
) {
  return {
    appName: 'New Ways',
    baseURL: config.get('BETTER_AUTH_URL', { infer: true }),
    basePath: '/api/auth',
    secret: config.get('BETTER_AUTH_SECRET', { infer: true }),
    trustedOrigins: [config.get('FRONTEND_URL', { infer: true })],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: PASSWORD_RESET_TTL_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) =>
        sendInBackground('redefinição de senha', () => emails.sendPasswordReset({ user, token })),
    },
    emailVerification: {
      sendOnSignUp: true,
      // O login não reenvia o link; o reenvio é pedido pelo botão (/send-verification-email).
      sendOnSignIn: false,
      autoSignInAfterVerification: true,
      expiresIn: EMAIL_VERIFICATION_TTL_SECONDS,
      sendVerificationEmail: async ({ user, url }) =>
        sendInBackground('verificação de conta', () => emails.sendEmailVerification({ user, url })),
    },
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // O reenvio nativo usa um callback que ignora falhas de e-mail; convide novamente.
        if (ctx.path === '/organization/invite-member' && ctx.body?.resend) {
          throw new APIError('BAD_REQUEST', {
            code: 'INVITATION_RESEND_UNSUPPORTED',
            message: 'Para reenviar o convite, convide o mesmo e-mail novamente.',
          });
        }
      }),
    },
    session: {
      expiresIn: 2 * 60 * 60,
      updateAge: 0,
      cookieCache: { enabled: false },
    },
    plugins: [
      organization({
        requireEmailVerificationOnInvitation: true,
        // Convidar novamente cancela o convite pendente e envia um novo e-mail.
        cancelPendingInvitationsOnReInvite: true,
        schema: {
          organization: {
            additionalFields: {
              address: {
                type: 'string',
                required: false,
                validator: { input: organizationDetailsSchema.shape.address },
              },
              email: {
                type: 'string',
                required: false,
                validator: { input: organizationDetailsSchema.shape.email },
              },
            },
          },
        },
        organizationHooks: {
          // A alteração já foi salva: o e-mail não deve fazê-la parecer ter falhado.
          afterUpdateMemberRole: async ({ member, previousRole, user, organization: company }) => {
            if (member.role === previousRole) return;
            sendInBackground('alteração de cargo', () =>
              emails.sendMemberRoleChanged({
                user,
                organizationName: company.name,
                previousRole,
                role: member.role,
              }),
            );
          },
          // O envio fica neste hook, e não em sendInvitationEmail, porque o Better Auth
          // descarta falhas daquele callback; aqui o erro chega a quem convidou.
          afterCreateInvitation: async ({ invitation, inviter, organization: company }) => {
            try {
              await emails.sendInvitation({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt,
                organizationName: company.name,
                inviter,
              });
            } catch {
              logger.error('Não foi possível enviar o e-mail de convite.');
              throw new APIError('BAD_GATEWAY', {
                code: 'INVITATION_EMAIL_FAILED',
                message: 'Não foi possível enviar o e-mail de convite. Tente novamente.',
              });
            }
          },
          beforeCreateOrganization: async ({ organization: data }) => ({
            data: { ...data, ...validateOrganizationDetails(data) },
          }),
          beforeUpdateOrganization: async ({ organization: data }) => {
            if (data.slug !== undefined) {
              throw new APIError('BAD_REQUEST', {
                code: 'ORGANIZATION_CODE_IMMUTABLE',
                message: 'O código da empresa não pode ser alterado.',
              });
            }
            return { data: { ...data, ...validateOrganizationDetails(data) } };
          },
        },
      }),
      openAPI(),
    ],
  } satisfies BetterAuthOptions;
}
