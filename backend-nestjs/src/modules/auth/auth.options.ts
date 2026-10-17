import { ConfigService } from '@nestjs/config';
import type { BetterAuthOptions } from 'better-auth';
import { openAPI, organization } from 'better-auth/plugins';
import type { Environment } from '../../shared/config/env.js';

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
      cookieCache: { enabled: false },
    },
    plugins: [organization(), openAPI()],
  } satisfies BetterAuthOptions;
}
