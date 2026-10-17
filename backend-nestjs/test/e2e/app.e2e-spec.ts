import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../../src/shared/database/database.service.js';
import { ImagesRepository } from '../../src/modules/images/images.repository.js';
import { StorageService } from '../../src/shared/storage/storage.service.js';
import { setupDocumentation } from '../../src/shared/config/documentation.js';

describe('API HTTP (banco e S3 simulados)', () => {
  let app: INestApplication;
  const repository = { create: vi.fn(), findById: vi.fn(), markReady: vi.fn() };
  const storage = {
    presignUpload: vi.fn(),
    head: vi.fn(),
    presignDownload: vi.fn(),
    expiresIn: 300,
  };

  beforeAll(async () => {
    vi.stubEnv(
      'DATABASE_URL',
      'postgresql://postgres:postgres@localhost:5432/test',
    );
    vi.stubEnv('S3_REGION', 'us-east-1');
    vi.stubEnv('S3_BUCKET', 'test-images');
    const { AppModule } = await import('../../src/app.module.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({})
      .overrideProvider(ImagesRepository)
      .useValue(repository)
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    app = module.createNestApplication();
    setupDocumentation(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    vi.unstubAllEnvs();
  });

  it('serve a aplicação e as documentações', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
    await request(app.getHttpServer()).get('/docs').expect(200);
    await request(app.getHttpServer()).get('/swagger').expect(200);
    const response = await request(app.getHttpServer())
      .get('/openapi.json')
      .expect(200);
    expect(
      response.body.paths['/images/upload-url'].post.requestBody.content[
        'application/json'
      ].schema,
    ).toMatchObject({
      required: ['filename', 'contentType', 'size', 'checksum'],
    });
  });

  it('valida corpo e parâmetros com Zod antes de acessar serviços externos', async () => {
    await request(app.getHttpServer())
      .post('/images/upload-url')
      .send({ filename: 'x.svg', contentType: 'image/svg+xml', size: 1 })
      .expect(400);
    await request(app.getHttpServer())
      .get('/images/invalid/download-url')
      .expect(400);
    expect(storage.presignUpload).not.toHaveBeenCalled();
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('executa upload, confirmação e leitura sem enviar bytes pela API', async () => {
    const input = {
      filename: 'photo.png',
      contentType: 'image/png',
      size: 100,
      checksum: Buffer.alloc(32).toString('base64'),
    };
    storage.presignUpload.mockResolvedValue('https://s3.example.com/upload');
    const upload = await request(app.getHttpServer())
      .post('/images/upload-url')
      .send(input)
      .expect(201);
    const image = {
      ...input,
      id: upload.body.id,
      key: `images/${upload.body.id}`,
      status: 'pending',
    };
    repository.findById.mockResolvedValue(image);
    storage.head.mockResolvedValue({
      ContentLength: input.size,
      ContentType: input.contentType,
      ChecksumSHA256: input.checksum,
    });
    repository.markReady.mockResolvedValue({ ...image, status: 'ready' });
    await request(app.getHttpServer())
      .post(`/images/${image.id}/complete`)
      .expect(200);
    repository.findById.mockResolvedValue({ ...image, status: 'ready' });
    storage.presignDownload.mockResolvedValue(
      'https://s3.example.com/download',
    );
    const download = await request(app.getHttpServer())
      .get(`/images/${image.id}/download-url`)
      .expect(200);
    expect(download.body.url).toBe('https://s3.example.com/download');
  });
});
