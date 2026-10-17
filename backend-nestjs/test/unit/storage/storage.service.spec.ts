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

  it('assina PUT com as credenciais e endpoint existentes e vincula tamanho, MIME e checksum', async () => {
    const service = new StorageService(config);
    try {
      const checksum = Buffer.alloc(32).toString('base64');
      const url = new URL(
        await service.presignUpload(
          'images/example',
          'image/png',
          123,
          checksum,
        ),
      );
      expect(url.origin).toBe('http://localhost:9000');
      expect(url.pathname).toBe('/test-images/images/example');
      expect(url.searchParams.get('X-Amz-Credential')).toContain(
        'example-key/',
      );
      expect(url.searchParams.get('X-Amz-Credential')).toContain(
        '/us-east-1/s3/',
      );
      expect(url.searchParams.get('X-Amz-Expires')).toBe('120');
      const signed = url.searchParams.get('X-Amz-SignedHeaders')!.split(';');
      expect(signed).toEqual(
        expect.arrayContaining([
          'content-type',
          'content-length',
          'x-amz-checksum-sha256',
        ]),
      );
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
});
