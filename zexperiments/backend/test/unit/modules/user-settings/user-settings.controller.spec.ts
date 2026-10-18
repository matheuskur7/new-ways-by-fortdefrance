import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { UserSettingsController } from '../../../../src/modules/user-settings/user-settings.controller.js';
import { UserSettingsService } from '../../../../src/modules/user-settings/user-settings.service.js';
import { configureApplication } from '../../../../src/shared/http/configure-application.js';

describe('User settings HTTP contract (mocked session and storage)', () => {
  let app: NestExpressApplication;
  const service = {
    createUpload: vi
      .fn()
      .mockResolvedValue({ imageKey: 'key', uploadUrl: 'url' }),
    removeImage: vi.fn().mockResolvedValue({ success: true }),
    update: vi.fn().mockResolvedValue({ success: true }),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserSettingsController],
      providers: [
        { provide: UserSettingsService, useValue: service },
        {
          provide: APP_GUARD,
          useValue: {
            canActivate(context: ExecutionContext) {
              context.switchToHttp().getRequest().authSession = {
                user: { id: 'alice' },
              };
              return true;
            },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  it('exposes upload creation at the path used by the frontend proxy', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/user-settings/avatar-upload')
      .expect(201);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(service.createUpload).toHaveBeenCalledWith('alice');
  });
  it('removes the authenticated user photo', async () => {
    await request(app.getHttpServer())
      .delete('/api/user-settings/avatar')
      .expect(200);
    expect(service.removeImage).toHaveBeenCalledWith('alice');
  });
  it('trims names and derives the user from the session', async () => {
    await request(app.getHttpServer())
      .patch('/api/user-settings')
      .send({ name: ' Alice ' })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ name: 'Alice' }),
    );
  });
  it('rejects blank names, foreign fields and invalid image keys before updating', async () => {
    service.update.mockClear();
    for (const body of [
      { name: ' ' },
      { name: 'Alice', userId: 'bob' },
      { name: 'Alice', imageKey: '../photo.jpg' },
    ]) {
      await request(app.getHttpServer())
        .patch('/api/user-settings')
        .send(body)
        .expect(400);
    }
    expect(service.update).not.toHaveBeenCalled();
  });
});
