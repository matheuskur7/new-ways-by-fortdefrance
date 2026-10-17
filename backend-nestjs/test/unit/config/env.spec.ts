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
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      S3_KEY_ID: 'example-id',
      S3_KEY_SECRET: 'example-secret',
    });
    expect(config.PORT).toBe(4000);
    expect(config.S3_FORCE_PATH_STYLE).toBe(false);
    expect(config.S3_URL_TTL_SECONDS).toBe(300);
    expect(config.FRONTEND_URL).toBe('https://example.com');
    expect(config.SMTP_PORT).toBe(465);
    expect(config.SMTP_SECURE).toBe(true);
    expect(config.S3_KEY_ID).toBe('example-id');
    expect(
      validateEnv({ ...valid, S3_FORCE_PATH_STYLE: 'true' })
        .S3_FORCE_PATH_STYLE,
    ).toBe(true);
  });

  it('aceita variáveis opcionais vazias e credenciais pela cadeia padrão AWS', () => {
    const config = validateEnv({
      ...valid,
      S3_ENDPOINT: '',
      S3_KEY_ID: '',
      S3_KEY_SECRET: '',
      SMTP_PORT: '',
      SMTP_SECURE: '',
      SMTP_REPLY_TO: '',
    });
    expect(config.S3_ENDPOINT).toBeUndefined();
    expect(config.S3_KEY_ID).toBeUndefined();
    expect(config.SMTP_PORT).toBeUndefined();
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
    { SMTP_SECURE: 'yes' },
  ])('rejeita configuração inválida: %o', (override) => {
    expect(() => validateEnv({ ...valid, ...override })).toThrow(
      'Configuração inválida',
    );
  });
});
