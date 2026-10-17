import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Environment } from '../../../src/shared/config/env.js';
import type { Image } from '../../../src/shared/database/schemas/index.js';
import { StorageService } from '../../../src/shared/storage/storage.service.js';
import { ImagesRepository } from '../../../src/modules/images/images.repository.js';
import { ImagesService } from '../../../src/modules/images/images.service.js';

const dto = {
  filename: 'image.png',
  contentType: 'image/png' as const,
  size: 123,
  checksum: Buffer.alloc(32).toString('base64'),
};
const image: Image = {
  id: '599b0722-4044-492b-97e2-24eac74a902a',
  key: 'images/test',
  ...dto,
  status: 'pending',
  createdAt: new Date(),
};

describe('ImagesService', () => {
  const repository = {
    create: vi.fn(),
    findById: vi.fn(),
    markReady: vi.fn(),
  };
  const storage = {
    presignUpload: vi.fn(),
    head: vi.fn(),
    presignDownload: vi.fn(),
    expiresIn: 300,
  };
  const config = new ConfigService<Environment, true>({
    MAX_IMAGE_SIZE_BYTES: 1024,
  });
  let service: ImagesService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new ImagesService(
      repository as unknown as ImagesRepository,
      storage as unknown as StorageService,
      config,
    );
    repository.findById.mockResolvedValue(image);
    repository.markReady.mockResolvedValue({ ...image, status: 'ready' });
  });

  it('gera chave própria e assina os metadados sem receber o arquivo', async () => {
    storage.presignUpload.mockResolvedValue('https://s3.example.com/upload');
    const result = await service.createUpload(dto);
    expect(result.method).toBe('PUT');
    expect(storage.presignUpload).toHaveBeenCalledWith(
      `images/${result.id}`,
      dto.contentType,
      dto.size,
      dto.checksum,
    );
    expect(repository.create).toHaveBeenCalledWith({
      ...dto,
      id: result.id,
      key: `images/${result.id}`,
    });
    expect(result.headers['x-amz-checksum-sha256']).toBe(dto.checksum);
  });

  it('rejeita tamanho acima do limite antes de assinar ou persistir', async () => {
    await expect(service.createUpload({ ...dto, size: 1025 })).rejects.toThrow(
      BadRequestException,
    );
    expect(storage.presignUpload).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('confirma somente após verificar os metadados no S3', async () => {
    storage.head.mockResolvedValue({
      ContentLength: dto.size,
      ContentType: dto.contentType,
      ChecksumSHA256: dto.checksum,
    });
    expect(await service.complete(image.id)).toMatchObject({ status: 'ready' });
    expect(storage.head).toHaveBeenCalledWith(image.key);
  });

  it.each([
    {
      ContentLength: 999,
      ContentType: dto.contentType,
      ChecksumSHA256: dto.checksum,
    },
    {
      ContentLength: dto.size,
      ContentType: 'text/html',
      ChecksumSHA256: dto.checksum,
    },
    {
      ContentLength: dto.size,
      ContentType: dto.contentType,
      ChecksumSHA256: 'wrong',
    },
  ])('rejeita objeto incompatível: %o', async (metadata) => {
    storage.head.mockResolvedValue(metadata);
    await expect(service.complete(image.id)).rejects.toThrow(
      BadRequestException,
    );
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
    await expect(service.complete(image.id)).rejects.toThrow(
      BadRequestException,
    );
    const error = new Error('S3 indisponível');
    storage.head.mockRejectedValue(error);
    await expect(service.complete(image.id)).rejects.toThrow(error);
  });

  it('não assina downloads de imagens pendentes ou inexistentes', async () => {
    await expect(service.createDownload(image.id)).rejects.toThrow(
      BadRequestException,
    );
    repository.findById.mockResolvedValue(undefined);
    await expect(service.createDownload(image.id)).rejects.toThrow(
      NotFoundException,
    );
    expect(storage.presignDownload).not.toHaveBeenCalled();
  });

  it('confirma de forma idempotente e assina downloads de imagens prontas', async () => {
    repository.findById.mockResolvedValue({ ...image, status: 'ready' });
    storage.presignDownload.mockResolvedValue(
      'https://s3.example.com/download',
    );
    expect(await service.complete(image.id)).toMatchObject({ status: 'ready' });
    expect(storage.head).not.toHaveBeenCalled();
    expect(await service.createDownload(image.id)).toEqual({
      url: 'https://s3.example.com/download',
      expiresIn: 300,
    });
  });
});
