import 'reflect-metadata';
import { createHash } from 'node:crypto';
const prefix = `user-avatar/${createHash('sha256').update('alice').digest('hex')}-`;
import { UserSettingsService } from '../../../../src/modules/user-settings/user-settings.service.js';
import type { StorageService } from '../../../../src/shared/storage/storage.service.js';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';

function setup() {
  const storage = {
    getPresignedUploadUrl: vi
      .fn()
      .mockResolvedValue('https://storage.example/upload'),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ Contents: [] }),
    inspect: vi.fn().mockResolvedValue({
      ContentType: 'image/jpeg',
      ContentLength: 10000,
      LastModified: new Date(),
    }),
  };
  const user = {
    findUnique: vi
      .fn()
      .mockResolvedValue({ image: 'user-avatar/alice/old.jpg' }),
    findFirst: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({}),
  };
  return {
    storage,
    user,
    service: new UserSettingsService(
      storage as unknown as StorageService,
      { user } as unknown as PrismaService,
    ),
  };
}
describe('UserSettingsService', () => {
  it('removes the photo after clearing the profile', async () => {
    const { service, storage, user } = setup();
    await service.removeImage('alice');
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 'alice' },
      data: { image: null },
    });
    expect(storage.delete).toHaveBeenCalledWith('user-avatar/alice/old.jpg');
  });
  it('deletes the previous photo only after a successful update', async () => {
    const { service, storage, user } = setup();
    user.update.mockRejectedValueOnce(new Error('Database'));
    await expect(
      service.update('alice', {
        name: 'Alice',
        imageKey: `${prefix}new.jpg`,
      }),
    ).rejects.toThrow('Database');
    expect(storage.delete).not.toHaveBeenCalled();
    await service.update('alice', {
      name: 'Alice',
      imageKey: `${prefix}new.jpg`,
    });
    expect(storage.delete).toHaveBeenCalledWith('user-avatar/alice/old.jpg');
  });
  it('removes abandoned objects while preserving recent and referenced photos', async () => {
    const { service, storage, user } = setup();
    storage.list.mockResolvedValueOnce({
      Contents: [
        {
          Key: 'user-avatar/alice/abandoned.jpg',
          LastModified: new Date(Date.now() - 48 * 3600_000),
        },
        {
          Key: 'user-avatar/alice/current.jpg',
          LastModified: new Date(Date.now() - 48 * 3600_000),
        },
        { Key: 'user-avatar/alice/recent.jpg', LastModified: new Date() },
      ],
    } as never);
    user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'alice' } as never);
    await service.cleanupAbandonedUploads();
    expect(storage.delete).toHaveBeenCalledExactlyOnceWith(
      'user-avatar/alice/abandoned.jpg',
    );
  });
  it('creates a short-lived JPEG upload scoped to the authenticated user', async () => {
    const { service, storage } = setup();
    const upload = await service.createUpload('alice');
    expect(upload.imageKey).toMatch(
      /^user-avatar\/[0-9a-f]{64}-[0-9a-f-]+\.jpg$/,
    );
    expect(storage.getPresignedUploadUrl).toHaveBeenCalledWith(
      upload.imageKey,
      'image/jpeg',
      300,
    );
  });
  it('rejects another user image before inspecting or updating it', async () => {
    const { service, storage, user } = setup();
    await expect(
      service.update('alice', {
        name: 'Alice',
        imageKey: 'user-avatar/bob/image.jpg',
      }),
    ).rejects.toThrow('não pertence');
    expect(storage.inspect).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
  });
  it('rejects oversized and missing uploads', async () => {
    const { service, storage, user } = setup();
    storage.inspect.mockResolvedValueOnce({
      ContentType: 'image/jpeg',
      ContentLength: 300000,
    });
    await expect(
      service.update('alice', {
        name: 'Alice',
        imageKey: `${prefix}image.jpg`,
      }),
    ).rejects.toThrow('200 KB');
    storage.inspect.mockRejectedValueOnce(new Error('Missing'));
    await expect(
      service.update('alice', {
        name: 'Alice',
        imageKey: `${prefix}image.jpg`,
      }),
    ).rejects.toThrow('Envie a imagem');
    expect(user.update).not.toHaveBeenCalled();
  });
  it('preserves the photo on name-only updates and stores a permanent key after upload', async () => {
    const { service, user } = setup();
    await service.update('alice', { name: 'Alice' });
    expect(user.update).toHaveBeenLastCalledWith({
      where: { id: 'alice' },
      data: { name: 'Alice' },
    });
    await service.update('alice', {
      name: 'Alice',
      imageKey: `${prefix}image.jpg`,
    });
    expect(user.update).toHaveBeenLastCalledWith({
      where: { id: 'alice' },
      data: { name: 'Alice', image: `${prefix}image.jpg` },
    });
  });
});
