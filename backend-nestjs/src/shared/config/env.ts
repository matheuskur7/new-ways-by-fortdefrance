import { z } from 'zod';

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());
const port = z.coerce.number().int().min(1).max(65535);
const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');
const httpUrl = z.url({ protocol: /^https?$/ });

export const initialSeedSchema = z.object({
  INITIAL_USER_NAME: z.string().trim().min(1),
  INITIAL_USER_EMAIL: z.email().transform((value) => value.toLowerCase()),
  INITIAL_USER_PASSWORD: z.string().min(8).max(128),
  INITIAL_ORGANIZATION_NAME: z.string().trim().min(1),
  INITIAL_ORGANIZATION_SLUG: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const mailbox = z
  .string()
  .trim()
  .refine((value) => {
    if (/[\r\n]/.test(value)) return false;
    const address = value.match(/^[^<>]+<([^<>]+)>$/)?.[1]?.trim() ?? value;
    return z.email().safeParse(address).success;
  }, 'Informe um e-mail válido, com nome de exibição opcional.');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: port.default(5000),
    FRONTEND_URL: httpUrl.default('http://localhost:3000'),
    POSTGRES_USER: optional(z.string().min(1)),
    POSTGRES_PASSWORD: optional(z.string().min(1)),
    POSTGRES_DB: optional(z.string().min(1)),
    DATABASE_URL: z
      .url()
      .refine((url) => ['postgres:', 'postgresql:'].includes(new URL(url).protocol)),
    S3_REGION: z.string().min(1),
    S3_ENDPOINT: optional(httpUrl),
    S3_KEY_ID: optional(z.string().min(1)),
    S3_KEY_SECRET: optional(z.string().min(1)),
    S3_BUCKET: z.string().min(1),
    S3_FORCE_PATH_STYLE: booleanString.default(false),
    S3_URL_TTL_SECONDS: z.coerce.number().int().min(1).max(3600).default(300),
    MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().min(1).max(104857600).default(10485760),
    JWT_SECRET: optional(z.string().min(1)),
    JWT_EXPIRES_IN: optional(z.string().min(1)),
    BETTER_AUTH_URL: httpUrl,
    BETTER_AUTH_SECRET: z.string().min(32),
    INITIAL_USER_NAME: optional(initialSeedSchema.shape.INITIAL_USER_NAME),
    INITIAL_USER_PASSWORD: optional(initialSeedSchema.shape.INITIAL_USER_PASSWORD),
    INITIAL_USER_EMAIL: optional(initialSeedSchema.shape.INITIAL_USER_EMAIL),
    INITIAL_ORGANIZATION_NAME: optional(initialSeedSchema.shape.INITIAL_ORGANIZATION_NAME),
    INITIAL_ORGANIZATION_SLUG: optional(initialSeedSchema.shape.INITIAL_ORGANIZATION_SLUG),
    SMTP_HOST: optional(z.string().trim().min(1)),
    SMTP_PORT: port.default(465),
    SMTP_SECURE: booleanString.default(true),
    SMTP_USER: optional(z.string().min(1)),
    SMTP_PASSWORD: optional(z.string().min(1)),
    SMTP_FROM: optional(mailbox),
    SMTP_REPLY_TO: optional(mailbox),
  })
  .superRefine((env, context) => {
    if (env.SMTP_HOST || env.SMTP_USER || env.SMTP_PASSWORD) {
      for (const field of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'] as const) {
        if (!env[field])
          context.addIssue({
            code: 'custom',
            path: [field],
            message: 'Campo obrigatório para envio SMTP.',
          });
      }
    }
    if (Boolean(env.S3_KEY_ID) !== Boolean(env.S3_KEY_SECRET)) {
      context.addIssue({
        code: 'custom',
        path: ['S3_KEY_ID'],
        message: 'S3_KEY_ID e S3_KEY_SECRET devem ser informados juntos.',
      });
    }
  });

export type Environment = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Environment {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    // Não inclui valores de variáveis, que podem conter credenciais.
    throw new Error(
      `Configuração inválida: ${result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  return result.data;
}
