import { describe, expect, it } from 'vitest';
import { validateEnv } from '../../../src/shared/config/env.js';

const valid = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
  BETTER_AUTH_URL: 'http://localhost:5000',
  BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'test-images',
};

describe('Configuração do ambiente', () => {
  it('converte números e booleanos e preserva os nomes do ambiente existente', () => {
    const config = validateEnv({
      ...valid,
      PORT: '4000',
      S3_FORCE_PATH_STYLE: 'false',
      FRONTEND_URL: 'https://example.com',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'sender@example.com',
      SMTP_PASSWORD: 'test-password',
      SMTP_FROM: 'New Ways <sender@example.com>',
      SMTP_REPLY_TO: 'support@example.com',
      S3_KEY_ID: 'example-id',
      S3_KEY_SECRET: 'example-secret',
    });
    expect(config.PORT).toBe(4000);
    expect(config.S3_FORCE_PATH_STYLE).toBe(false);
    expect(config.S3_URL_TTL_SECONDS).toBe(300);
    expect(config.FRONTEND_URL).toBe('https://example.com');
    expect(config.SMTP_PORT).toBe(587);
    expect(config.SMTP_SECURE).toBe(false);
    expect(config.SMTP_FROM).toBe('New Ways <sender@example.com>');
    expect(config.SMTP_REPLY_TO).toBe('support@example.com');
    expect(config.S3_KEY_ID).toBe('example-id');
    expect(validateEnv({ ...valid, S3_FORCE_PATH_STYLE: 'true' }).S3_FORCE_PATH_STYLE).toBe(true);
  });

  it('aceita variáveis opcionais vazias e credenciais pela cadeia padrão AWS', () => {
    const config = validateEnv({
      ...valid,
      S3_ENDPOINT: '',
      S3_KEY_ID: '',
      S3_KEY_SECRET: '',
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASSWORD: '',
      SMTP_FROM: '',
      SMTP_REPLY_TO: '',
      INITIAL_USER_NAME: '',
      INITIAL_USER_EMAIL: '',
      INITIAL_USER_PASSWORD: '',
      INITIAL_ORGANIZATION_NAME: '',
      INITIAL_ORGANIZATION_SLUG: '',
    });
    expect(config.S3_ENDPOINT).toBeUndefined();
    expect(config.S3_KEY_ID).toBeUndefined();
    expect(config.SMTP_HOST).toBeUndefined();
    expect(config.SMTP_FROM).toBeUndefined();
    expect(config.INITIAL_USER_NAME).toBeUndefined();
    expect(config.INITIAL_ORGANIZATION_NAME).toBeUndefined();
    expect(config.INITIAL_ORGANIZATION_SLUG).toBeUndefined();
  });

  it('valida e normaliza as configurações do usuário e da empresa iniciais', () => {
    const config = validateEnv({
      ...valid,
      INITIAL_USER_NAME: ' Usuário Inicial ',
      INITIAL_USER_EMAIL: 'INITIAL@example.com',
      INITIAL_USER_PASSWORD: 'example-password',
      INITIAL_ORGANIZATION_NAME: ' Fort de France - Matriz ',
      INITIAL_ORGANIZATION_SLUG: 'fortdefrance-matriz',
    });
    expect(config.INITIAL_USER_NAME).toBe('Usuário Inicial');
    expect(config.INITIAL_USER_EMAIL).toBe('initial@example.com');
    expect(config.INITIAL_ORGANIZATION_NAME).toBe('Fort de France - Matriz');
    expect(config.INITIAL_ORGANIZATION_SLUG).toBe('fortdefrance-matriz');
  });

  it.each([
    { DATABASE_URL: undefined },
    { DATABASE_URL: 'https://example.com' },
    { PORT: '0' },
    { S3_BUCKET: '' },
    { S3_URL_TTL_SECONDS: '3601' },
    { MAX_IMAGE_SIZE_BYTES: '-1' },
    { S3_FORCE_PATH_STYLE: 'yes' },
    { FRONTEND_URL: '*' },
    { S3_KEY_ID: 'example-id' },
    { S3_KEY_SECRET: 'example-secret' },
    { BETTER_AUTH_SECRET: undefined },
    { BETTER_AUTH_SECRET: 'short' },
    { BETTER_AUTH_URL: undefined },
    { BETTER_AUTH_URL: 'invalid' },
    { SMTP_PORT: '0' },
    { SMTP_SECURE: 'yes' },
    { SMTP_HOST: 'smtp.example.com' },
    { SMTP_USER: 'sender@example.com', SMTP_FROM: '' },
    { SMTP_PASSWORD: 'test-password', SMTP_FROM: undefined },
    { SMTP_FROM: 'invalid' },
    { SMTP_FROM: 'Sender <invalid>' },
    { SMTP_FROM: 'Sender\r\nBcc: hidden@example.com <sender@example.com>' },
    { SMTP_REPLY_TO: 'invalid' },
    { INITIAL_USER_PASSWORD: 'short' },
    { INITIAL_ORGANIZATION_NAME: ' ' },
    { INITIAL_ORGANIZATION_SLUG: 'Fort de France' },
    { INITIAL_ORGANIZATION_SLUG: '-matriz' },
  ])('rejeita configuração inválida: %o', (override) => {
    expect(() => validateEnv({ ...valid, ...override })).toThrow('Configuração inválida');
  });
});
