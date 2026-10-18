import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Environment } from '../../../src/shared/config/env.js';
import { validateEnv } from '../../../src/shared/config/env.js';
import { StorageService } from '../../../src/shared/storage/storage.service.js';

describe('StorageService: assinatura local sem acesso ao S3', () => {
  const config = new ConfigService<Environment, true>(
    validateEnv({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      BETTER_AUTH_URL: 'http://localhost:5000',
      BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters',
      S3_REGION: 'us-east-1',
      S3_BUCKET: 'test-images',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_KEY_ID: 'example-key',
      S3_KEY_SECRET: 'example-secret',
      S3_FORCE_PATH_STYLE: 'true',
      S3_URL_TTL_SECONDS: '120',
    }),
  );

  it('assina PUT com as credenciais e endpoint existentes e exige escrita condicional sem parâmetros de arquivo', async () => {
    const service = new StorageService(config);
    try {
      const url = new URL(await service.presignUpload('images/example'));
      expect(url.origin).toBe('http://localhost:9000');
      expect(url.pathname).toBe('/test-images/images/example');
      expect(url.searchParams.get('X-Amz-Credential')).toContain('example-key/');
      expect(url.searchParams.get('X-Amz-Credential')).toContain('/us-east-1/s3/');
      expect(url.searchParams.get('X-Amz-Expires')).toBe('120');
      const signed = url.searchParams.get('X-Amz-SignedHeaders')!.split(';');
      expect(signed).toContain('if-none-match');
      expect(signed).not.toContain('content-type');
      expect(signed).not.toContain('content-length');
      expect([...url.searchParams.keys()].some((key) => /checksum/i.test(key))).toBe(false);
      expect(url.searchParams.has('X-Amz-Signature')).toBe(true);
    } finally {
      service.onApplicationShutdown();
    }
  });

  it('assina GET para a mesma chave com expiração limitada', async () => {
    const service = new StorageService(config);
    try {
      const url = new URL(await service.presignDownload('images/example'));
      expect(url.pathname).toBe('/test-images/images/example');
      expect(url.searchParams.get('X-Amz-Expires')).toBe('120');
      expect(url.searchParams.has('X-Amz-Signature')).toBe(true);
    } finally {
      service.onApplicationShutdown();
    }
  });
  it('permite leitura de fotos por 12 horas sem alterar a validade padrão de outras imagens', async () => {
    const service = new StorageService(config);
    try {
      const photo = new URL(await service.presignDownload('images/org/user-image/photo', 43200));
      const other = new URL(await service.presignDownload('images/example'));
      const upload = new URL(await service.presignUpload('images/org/user-image/new-photo'));
      expect(photo.searchParams.get('X-Amz-Expires')).toBe('43200');
      expect(other.searchParams.get('X-Amz-Expires')).toBe('120');
      expect(upload.searchParams.get('X-Amz-Expires')).toBe('120');
    } finally {
      service.onApplicationShutdown();
    }
  });
  it('usa PUT simples como zexperiments quando o provedor não suporta requisição condicional', async () => {
    const compatible = new ConfigService<Environment, true>({
      S3_REGION: 'br-se1',
      S3_BUCKET: 'test-images',
      S3_ENDPOINT: 'https://br-se1.magaluobjects.com',
      S3_KEY_ID: 'example-key',
      S3_KEY_SECRET: 'example-secret',
      S3_FORCE_PATH_STYLE: true,
      S3_USE_CONDITIONAL_UPLOAD: false,
      S3_URL_TTL_SECONDS: 300,
    });
    const service = new StorageService(compatible);
    try {
      const url = new URL(await service.presignUpload('images/org/user-image/new'));
      expect(service.uploadHeaders).toEqual({});
      expect(url.searchParams.get('X-Amz-SignedHeaders')).not.toContain('if-none-match');
      expect(url.searchParams.has('if-none-match')).toBe(false);
      expect(url.pathname).toBe('/test-images/images/org/user-image/new');
    } finally {
      service.onApplicationShutdown();
    }
  });
});
