import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Environment } from '../../../src/shared/config/env.js';
import type { StorageService } from '../../../src/shared/storage/storage.service.js';
import type { AuthService } from '../../../src/modules/auth/auth.service.js';
import type { OrganizationAccessService } from '../../../src/modules/organization/organization-access.service.js';
import { UserImageLifecycleService } from '../../../src/modules/images/user-images/user-image-lifecycle.service.js';
import type { UserImagesRepository } from '../../../src/modules/images/user-images/user-images.repository.js';
import { authSession } from '../../fixtures/auth.js';
import type { Image } from '../../../src/shared/database/schemas/index.js';

const id = '019a1234-5678-7000-8000-123456789abc';
const oldId = '019a1234-5678-7000-8000-123456789abd';

describe('UserImageLifecycleService', () => {
  const repository = {
    withImage: vi.fn(),
    deleteUnreferenced: vi.fn(),
    listOrganizationsForCleanup: vi.fn(),
    findAbandoned: vi.fn(),
  };
  const storage = { delete: vi.fn() };
  const updateUser = vi.fn();
  const organizations = { requireActiveOrganization: vi.fn() };
  const config = { get: vi.fn().mockReturnValue('http://localhost:3000') };
  const service = new UserImageLifecycleService(
    repository as unknown as UserImagesRepository,
    storage as unknown as StorageService,
    { auth: { api: { updateUser } } } as unknown as AuthService,
    organizations as unknown as OrganizationAccessService,
    config as unknown as ConfigService<Environment, true>,
  );
  const currentSession = {
    ...authSession,
    user: { ...authSession.user, image: `http://localhost:3000/user-images/${oldId}` },
  };
  let image: Image;

  beforeEach(() => {
    vi.clearAllMocks();
    image = {
      id,
      organizationId: 'org-test',
      keyPrefix: 'user-image',
      key: 'images/org-test/user-image/new',
      createdAt: new Date(),
      status: 'ready',
      contentType: 'image/png',
      size: 100,
    };
    organizations.requireActiveOrganization.mockResolvedValue('org-test');
    repository.listOrganizationsForCleanup.mockResolvedValue([]);
    repository.withImage.mockImplementation(async (_org, _id, action) => action(image));
    repository.deleteUnreferenced.mockResolvedValue(true);
    updateUser.mockResolvedValue({ response: { status: true }, headers: new Headers() });
  });

  it('vincula pelo Better Auth antes de tentar remover a foto anterior sem vínculo', async () => {
    await service.attach(id, 'Novo nome', currentSession, { cookie: 'session=example' });
    expect(repository.withImage).toHaveBeenCalledWith('org-test', id, expect.any(Function));
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { name: 'Novo nome', image: `http://localhost:3000/user-images/${id}` },
      }),
    );
    expect(repository.deleteUnreferenced).toHaveBeenCalledWith(
      'org-test',
      oldId,
      expect.any(Function),
    );
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      repository.deleteUnreferenced.mock.invocationCallOrder[0]!,
    );
  });

  it('mantém a foto anterior se a atualização do perfil falhar', async () => {
    updateUser.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(service.attach(id, 'Nome', currentSession, {})).rejects.toThrow();
    expect(repository.deleteUnreferenced).not.toHaveBeenCalled();
    expect(repository.listOrganizationsForCleanup).not.toHaveBeenCalled();
  });

  it('não desfaz o perfil atualizado quando a exclusão falha', async () => {
    repository.deleteUnreferenced.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(service.attach(id, 'Nome', currentSession, {})).resolves.toMatchObject({
      response: { status: true },
    });
  });

  it('rejeita imagem pendente ou criada há mais de uma hora antes de atualizar o usuário', async () => {
    image.status = 'pending';
    await expect(service.attach(id, 'Nome', currentSession, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    image.status = 'ready';
    image.createdAt = new Date(Date.now() - 2 * 3600_000);
    await expect(service.attach(id, 'Nome', currentSession, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('não permite foto de outro prefixo ou sem organização válida', async () => {
    image.keyPrefix = 'car-image';
    await expect(service.attach(id, 'Nome', currentSession, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    organizations.requireActiveOrganization.mockRejectedValueOnce(new ForbiddenException());
    await expect(service.attach(id, 'Nome', currentSession, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('limpa por organização apenas uploads anteriores a 24 horas com verificação de vínculo', async () => {
    repository.listOrganizationsForCleanup.mockResolvedValue([{ organizationId: 'org-test' }]);
    repository.findAbandoned.mockResolvedValue([{ id: oldId }]);
    const before = Date.now();
    await service.cleanupAbandonedUploads();
    const cutoff = repository.listOrganizationsForCleanup.mock.calls[0]![0] as Date;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before - 24 * 3600_000);
    expect(repository.deleteUnreferenced).toHaveBeenCalledWith(
      'org-test',
      oldId,
      expect.any(Function),
      cutoff,
    );
  });
  it('remove a referência pelo Better Auth antes da exclusão do objeto', async () => {
    await service.remove('Nome', currentSession, {});
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ body: { name: 'Nome', image: null } }),
    );
    expect(repository.deleteUnreferenced).toHaveBeenCalledWith(
      'org-test',
      oldId,
      expect.any(Function),
    );
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      repository.deleteUnreferenced.mock.invocationCallOrder[0]!,
    );
  });

  it('preserva a foto quando a remoção do vínculo falha', async () => {
    updateUser.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(service.remove('Nome', currentSession, {})).rejects.toThrow();
    expect(repository.deleteUnreferenced).not.toHaveBeenCalled();
    expect(repository.listOrganizationsForCleanup).not.toHaveBeenCalled();
  });
  it('dispara a limpeza de órfãs somente após vincular uma nova foto com sucesso', async () => {
    await service.attach(id, 'Nome', currentSession, {});
    expect(repository.listOrganizationsForCleanup).toHaveBeenCalledOnce();
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      repository.listOrganizationsForCleanup.mock.invocationCallOrder[0]!,
    );
  });

  it('não dispara a limpeza de órfãs ao remover a foto', async () => {
    await service.remove('Nome', currentSession, {});
    expect(repository.listOrganizationsForCleanup).not.toHaveBeenCalled();
  });
});
