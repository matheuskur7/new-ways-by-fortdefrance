import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserImagesService } from '../../../src/modules/images/user-images/user-images.service.js';
import type { ImagesRepository } from '../../../src/modules/images/images.repository.js';
import type { StorageService } from '../../../src/shared/storage/storage.service.js';
import type { OrganizationAccessService } from '../../../src/modules/organization/organization-access.service.js';
import { authSession } from '../../fixtures/auth.js';

describe('UserImagesService', () => {
  const repository = { findById: vi.fn() };
  const storage = { presignDownload: vi.fn() };
  const organizations = { requireActiveOrganization: vi.fn() };
  const service = new UserImagesService(
    repository as unknown as ImagesRepository,
    storage as unknown as StorageService,
    organizations as unknown as OrganizationAccessService,
  );
  const image = {
    keyPrefix: 'user-image',
    key: 'images/org-test/user-image/image-id',
    status: 'ready',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    organizations.requireActiveOrganization.mockResolvedValue('org-test');
    repository.findById.mockResolvedValue(image);
    storage.presignDownload.mockResolvedValue('https://s3.example.com/photo');
  });

  it('assina somente fotos prontas da organização validada por 12 horas', async () => {
    await expect(service.createDownload('image-id', authSession)).resolves.toEqual({
      url: 'https://s3.example.com/photo',
      expiresIn: 43200,
    });
    expect(repository.findById).toHaveBeenCalledWith('org-test', 'image-id');
    expect(storage.presignDownload).toHaveBeenCalledWith(image.key, 43200);
  });

  it('revalida o vínculo antes de consultar ou assinar', async () => {
    organizations.requireActiveOrganization.mockRejectedValue(new ForbiddenException());
    await expect(service.createDownload('image-id', authSession)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.findById).not.toHaveBeenCalled();
    expect(storage.presignDownload).not.toHaveBeenCalled();
  });

  it('não assina imagens de outra empresa ou prefixo', async () => {
    for (const value of [undefined, { ...image, keyPrefix: 'car-image' }]) {
      repository.findById.mockResolvedValue(value);
      await expect(service.createDownload('image-id', authSession)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    }
    expect(storage.presignDownload).not.toHaveBeenCalled();
  });

  it('não libera leitura antes da confirmação', async () => {
    repository.findById.mockResolvedValue({ ...image, status: 'pending' });
    await expect(service.createDownload('image-id', authSession)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.presignDownload).not.toHaveBeenCalled();
  });
});
