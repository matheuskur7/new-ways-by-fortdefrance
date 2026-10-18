import { ConfigService } from '@nestjs/config';
import type { BetterAuthOptions } from 'better-auth';
import { APIError } from 'better-auth/api';
import { openAPI, organization } from 'better-auth/plugins';
import { organizationDetailsSchema } from '../organization/dto/organization-details.dto.js';
import type { Environment } from '../../shared/config/env.js';

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

export function createAuthOptions(config: ConfigService<Environment, true>) {
  return {
    appName: 'New Ways',
    baseURL: config.get('BETTER_AUTH_URL', { infer: true }),
    basePath: '/api/auth',
    secret: config.get('BETTER_AUTH_SECRET', { infer: true }),
    trustedOrigins: [config.get('FRONTEND_URL', { infer: true })],
    emailAndPassword: { enabled: true },
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    session: {
      expiresIn: 2 * 60 * 60,
      updateAge: 0,
      cookieCache: { enabled: false },
    },
    plugins: [
      organization({
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
