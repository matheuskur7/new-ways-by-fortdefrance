import { NotFoundException } from '@nestjs/common';
import { ImageService } from '../../../../src/modules/image/image.service.js';
import type { ImageRepository } from '../../../../src/modules/image/image.repository.js';
import type { StorageService } from '../../../../src/shared/storage/storage.service.js';

const image = {
  id: '019a0000-0000-7000-8000-000000000001',
  key: 'car-image/test',
  tag: 'car-image',
  createdAt: new Date(),
  updatedAt: new Date(),
  serviceOrderId: null,
  userId: null,
};

function setup() {
  const repository = {
    create: vi.fn().mockImplementation((key: string, tag: string) => ({
      ...image,
      key,
      tag,
    })),
    findAll: vi.fn().mockResolvedValue({ data: [image], total: 51 }),
    findAllUnlinked: vi.fn().mockResolvedValue({ data: [image], total: 1 }),
    findOne: vi.fn().mockResolvedValue(image),
    remove: vi.fn().mockResolvedValue(image),
  };
  const storage = {
    getPresignedUploadUrl: vi.fn().mockResolvedValue('upload-url'),
    getPresignedUrl: vi.fn().mockResolvedValue('read-url'),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  const service = new ImageService(
    storage as unknown as StorageService,
    repository as unknown as ImageRepository,
  );
  return { repository, storage, service };
}

describe('ImageService', () => {
  it('creates a record and returns signed upload and read URLs', async () => {
    const { service, repository, storage } = setup();
    const result = await service.create('car-image');
    expect(repository.create).toHaveBeenCalledWith(
      expect.stringMatching(/^car-image\//),
      'car-image',
    );
    expect(storage.getPresignedUploadUrl).toHaveBeenCalledWith(
      result.imageData.key,
      'image/*',
      300,
    );
    expect(result.uploadUrl).toBe('upload-url');
    expect(result.imageData.url).toBe('read-url');
    expect(result.imageData.tag).toBe('car-image');
  });

  it('paginates records in groups of 50 and signs image URLs', async () => {
    const { service, repository } = setup();
    const result = await service.findAll(2);
    expect(repository.findAll).toHaveBeenCalledWith(
      {
        page: 2,
        perPage: 50,
        skip: 50,
        take: 50,
      },
      undefined,
    );
    expect(result.meta).toMatchObject({
      total: 51,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(result.data[0].url).toBe('read-url');
  });

  it('uses the unlinked query for images without a service order', async () => {
    const { service, repository } = setup();
    await service.findAllUnlinked(1);
    expect(repository.findAllUnlinked).toHaveBeenCalled();
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('does not delete a record when storage deletion fails', async () => {
    const { service, repository, storage } = setup();
    storage.delete.mockRejectedValue(new Error('Storage unavailable'));
    await expect(service.remove(image.id)).rejects.toThrow(
      'Storage unavailable',
    );
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('returns not found without accessing storage for a missing image', async () => {
    const { service, repository, storage } = setup();
    repository.findOne.mockResolvedValue(null);
    await expect(service.remove(image.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('deletes the stored object before removing its record', async () => {
    const { service, repository, storage } = setup();
    await expect(service.remove(image.id)).resolves.toEqual(image);
    expect(storage.delete).toHaveBeenCalledWith(image.key);
    expect(repository.remove).toHaveBeenCalledWith(image.id);
    expect(storage.delete.mock.invocationCallOrder[0]).toBeLessThan(
      repository.remove.mock.invocationCallOrder[0],
    );
  });
});
