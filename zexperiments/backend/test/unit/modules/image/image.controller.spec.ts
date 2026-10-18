import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ImageController } from '../../../../src/modules/image/image.controller.js';
import { ImageService } from '../../../../src/modules/image/image.service.js';
import { configureApplication } from '../../../../src/shared/http/configure-application.js';

const id = '019a0000-0000-7000-8000-000000000001';
const image = {
  id,
  key: `car-image/${id}`,
  tag: 'car-image',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: null,
  serviceOrderId: null,
};

const service = {
  create: vi.fn().mockResolvedValue({
    imageData: { ...image, url: 'https://example.com/read' },
    uploadUrl: 'https://example.com/upload',
  }),
  findAll: vi.fn().mockResolvedValue({
    data: [],
    meta: {
      page: 1,
      perPage: 50,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }),
  findAllUnlinked: vi.fn().mockResolvedValue({ data: [], meta: {} }),
  remove: vi.fn().mockResolvedValue(image),
};

describe('ImageController HTTP validation and Swagger (mocked service)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ImageController],
      providers: [{ provide: ImageService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  beforeEach(() => vi.clearAllMocks());
  afterAll(async () => app?.close());

  it.each(['/image', '/car-image'])(
    'accepts a valid upload at %s',
    async (path) => {
      await request(app.getHttpServer())
        .post(path)
        .send({ tag: 'car-image' })
        .expect(201);
      expect(service.create).toHaveBeenCalledWith('car-image');
    },
  );

  it.each([
    {},
    { tag: 'unknown-tag' },
    { tag: null },
    { tag: '' },
    { tag: '../car-image' },
    { tag: ['car-image'] },
    { tag: 123 },
    { tag: 'car-image', extra: true },
  ])(
    'rejects invalid upload body %j before calling the service',
    async (body) => {
      await request(app.getHttpServer()).post('/image').send(body).expect(400);
      expect(service.create).not.toHaveBeenCalled();
    },
  );

  it('defaults page to 1 and leaves the tag filter optional', async () => {
    await request(app.getHttpServer()).get('/image').expect(200);
    expect(service.findAll).toHaveBeenCalledWith(1, undefined);
  });

  it.each(['/image', '/image/unlinked'])(
    'transforms pagination and passes the filter at %s',
    async (path) => {
      await request(app.getHttpServer())
        .get(path)
        .query({ page: '2', tag: 'car-image' })
        .expect(200);
      const method = path.endsWith('unlinked')
        ? service.findAllUnlinked
        : service.findAll;
      expect(method).toHaveBeenCalledWith(2, 'car-image');
    },
  );

  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=abc',
    'page=42949674',
    'page=1&page=2',
    'tag=../car-image',
    'tag=unknown-tag',
    'tag=',
    'extra=true',
  ])('rejects invalid list query %s', async (query) => {
    await request(app.getHttpServer()).get(`/image?${query}`).expect(400);
    await request(app.getHttpServer())
      .get(`/image/unlinked?${query}`)
      .expect(400);
    expect(service.findAll).not.toHaveBeenCalled();
    expect(service.findAllUnlinked).not.toHaveBeenCalled();
  });

  it.each(['invalid', '550e8400-e29b-41d4-a716-446655440000'])(
    'rejects a non-v7 ID %s before deletion',
    async (invalidId) => {
      await request(app.getHttpServer())
        .delete(`/image/${invalidId}`)
        .expect(400);
      expect(service.remove).not.toHaveBeenCalled();
    },
  );

  it('accepts a UUID v7 for deletion', async () => {
    await request(app.getHttpServer())
      .delete(`/image/${id}`)
      .expect(200)
      .expect(image);
    expect(service.remove).toHaveBeenCalledWith(id);
  });

  it('returns 404 for a missing image', async () => {
    service.remove.mockRejectedValueOnce(
      new NotFoundException('Imagem não encontrada.'),
    );
    await request(app.getHttpServer()).delete(`/image/${id}`).expect(404);
  });

  it('serves Swagger UI', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs/')
      .expect(200);
    expect(response.text).toContain('Swagger UI');
  });

  it('documents request fields, pagination, UUID parameters and response schemas', async () => {
    const { body: document } = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    const paths = document.paths;
    expect(paths['/image/category/key/{key}']).toBeUndefined();
    expect(
      paths['/image'].post.responses['201'].content['application/json'].schema
        .$ref,
    ).toBe('#/components/schemas/CreateImageResponse');
    expect(paths['/image'].post.responses['400']).toBeDefined();
    expect(paths['/car-image'].post).toBeDefined();
    expect(
      paths['/image'].get.responses['200'].content['application/json'].schema
        .$ref,
    ).toBe('#/components/schemas/PaginatedImageResponse');
    expect(paths['/image'].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'page', required: false }),
        expect.objectContaining({ name: 'tag', required: false }),
      ]),
    );
    expect(paths['/image/{id}'].delete.parameters[0]).toMatchObject({
      name: 'id',
      schema: { format: 'uuid' },
    });
    expect(paths['/image/{id}'].delete.responses['404']).toBeDefined();
    const schemas = document.components.schemas;
    expect(schemas.ImageTagDto.required).toContain('tag');
    expect(schemas.ImageTagDto.properties.tag.enum).toEqual(['car-image']);
    expect(
      paths['/image'].get.parameters.find(
        (param: { name: string }) => param.name === 'tag',
      ).schema.enum,
    ).toEqual(['car-image']);
    expect(schemas.PaginatedImageResponse.properties.data.items.$ref).toBe(
      '#/components/schemas/GetImageResponse',
    );
    expect(schemas.GetImageResponse.properties.tag).toBeDefined();
    expect(schemas.GetImageResponse.properties.url).toBeDefined();
    expect(schemas.ImageResponse.properties.url).toBeUndefined();
    expect(schemas.ImageResponse.properties.userId.nullable).toBe(true);
  });
});
