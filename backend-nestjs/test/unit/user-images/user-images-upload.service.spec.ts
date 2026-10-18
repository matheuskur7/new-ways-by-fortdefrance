import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authSession } from '../../fixtures/auth.js';
import type { Environment } from '../../../src/shared/config/env.js';
import type { UserImage } from '../../../src/shared/database/schemas/index.js';
import { StorageService } from '../../../src/shared/storage/storage.service.js';
import { UserImagesRepository } from '../../../src/modules/user-images/user-images.repository.js';
import type { AuthService } from '../../../src/modules/auth/auth.service.js';
import { UserImagesService } from '../../../src/modules/user-images/user-images.service.js';

const image: UserImage = {
  id: '019a1234-5678-7000-8000-123456789abc',
  importedKey: null,
  key: 'images/org-test/user-image/019a1234-5678-7000-8000-123456789abc',
  contentType: null,
  size: null,
  status: 'pending',
  createdAt: new Date(),
  userId: authSession.user.id,
};
const metadata = { ContentType: 'image/png', ContentLength: 123 };

describe('UserImagesService', () => {
  const repository = { create: vi.fn(), findById: vi.fn(), markReady: vi.fn() };
  const storage = {
    presignUpload: vi.fn(),
    head: vi.fn(),
    presignDownload: vi.fn(),
    uploadHeaders: { 'If-None-Match': '*' as const },
    expiresIn: 300,
  };
  const config = new ConfigService<Environment, true>({
    MAX_IMAGE_SIZE_BYTES: 1024,
  });
  let service: UserImagesService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new UserImagesService(
      repository as unknown as UserImagesRepository,
      storage as unknown as StorageService,
      {} as AuthService,
      config,
    );
    repository.create.mockResolvedValue(image);
    repository.findById.mockResolvedValue(image);
    repository.markReady.mockResolvedValue({
      ...image,
      contentType: 'image/png',
      size: 123,
      status: 'ready',
    });
  });

  it('persiste antes de assinar e usa o UUIDv7 retornado pelo banco', async () => {
    storage.presignUpload.mockResolvedValue('https://s3.example.com/upload');
    const result = await service.createUpload(authSession);
    expect(result).toEqual({
      id: image.id,
      key: image.key,
      status: 'pending',
      method: 'PUT',
      url: 'https://s3.example.com/upload',
      expiresIn: 300,
      headers: { 'If-None-Match': '*' },
    });
    expect(repository.create).toHaveBeenCalledWith(authSession.user.id);
    expect(storage.presignUpload).toHaveBeenCalledWith(image.key);
    expect(repository.create.mock.invocationCallOrder[0]).toBeLessThan(
      storage.presignUpload.mock.invocationCallOrder[0],
    );
  });

  it('mantém o registro pendente quando a assinatura falha', async () => {
    storage.presignUpload.mockRejectedValue(new Error('Falha ao assinar'));
    await expect(service.createUpload(authSession)).rejects.toThrow('Falha ao assinar');
    expect(repository.create).toHaveBeenCalledOnce();
    expect(repository.markReady).not.toHaveBeenCalled();
  });

  it('não assina se a persistência falhar', async () => {
    repository.create.mockRejectedValue(new Error('Banco indisponível'));
    await expect(service.createUpload(authSession)).rejects.toThrow('Banco indisponível');
    expect(storage.presignUpload).not.toHaveBeenCalled();
  });

  it('confirma e persiste tipo e tamanho obtidos do S3 no escopo correto', async () => {
    storage.head.mockResolvedValue(metadata);
    expect(await service.complete(image.id, authSession)).toMatchObject({
      id: image.id,
      key: image.key,
      contentType: 'image/png',
      size: 123,
      status: 'ready',
    });
    expect(repository.findById).toHaveBeenCalledWith(authSession.user.id, image.id);
    expect(repository.markReady).toHaveBeenCalledWith(authSession.user.id, image.id, {
      contentType: 'image/png',
      size: 123,
    });
    expect(storage.head).toHaveBeenCalledWith(image.key);
  });

  it.each([
    { ContentType: 'text/html', ContentLength: 123 },
    { ContentType: 'image/svg+xml', ContentLength: 123 },
    { ContentLength: 123 },
    { ContentType: 'image/png', ContentLength: 0 },
    { ContentType: 'image/png', ContentLength: -1 },
    { ContentType: 'image/png', ContentLength: 1025 },
    { ContentType: 'image/png' },
  ])('mantém pendente quando os metadados são inválidos: %o', async (object) => {
    storage.head.mockResolvedValue(object);
    await expect(service.complete(image.id, authSession)).rejects.toThrow(BadRequestException);
    expect(repository.markReady).not.toHaveBeenCalled();
  });

  it('trata upload ausente e preserva erros de infraestrutura', async () => {
    storage.head.mockRejectedValue(
      new S3ServiceException({
        name: 'NotFound',
        $fault: 'client',
        $metadata: { httpStatusCode: 404 },
      }),
    );
    await expect(service.complete(image.id, authSession)).rejects.toThrow(BadRequestException);
    const error = new Error('S3 indisponível');
    storage.head.mockRejectedValue(error);
    await expect(service.complete(image.id, authSession)).rejects.toThrow(error);
  });

  it('não assina downloads pendentes ou inexistentes', async () => {
    await expect(service.createDownload(image.id, authSession)).rejects.toThrow(
      BadRequestException,
    );
    repository.findById.mockResolvedValue(undefined);
    await expect(service.createDownload(image.id, authSession)).rejects.toThrow(NotFoundException);
    expect(storage.presignDownload).not.toHaveBeenCalled();
  });

  it('confirma de forma idempotente e assina downloads de imagens prontas', async () => {
    repository.findById.mockResolvedValue({ ...image, status: 'ready' });
    storage.presignDownload.mockResolvedValue('https://s3.example.com/download');
    expect(await service.complete(image.id, authSession)).toMatchObject({
      status: 'ready',
    });
    expect(storage.head).not.toHaveBeenCalled();
    expect(await service.createDownload(image.id, authSession)).toEqual({
      url: 'https://s3.example.com/download',
      expiresIn: 43200,
    });
  });
});
