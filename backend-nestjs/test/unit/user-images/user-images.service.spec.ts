import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserImagesService } from '../../../src/modules/user-images/user-images.service.js';
import type { UserImagesRepository } from '../../../src/modules/user-images/user-images.repository.js';
import type { AuthService } from '../../../src/modules/auth/auth.service.js';
import type { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../src/shared/config/env.js';
import type { UserImage } from '../../../src/shared/database/schemas/index.js';
import type { StorageService } from '../../../src/shared/storage/storage.service.js';
import { authSession } from '../../fixtures/auth.js';

const id = '019a1234-5678-7000-8000-123456789abc';
const oldId = '019a1234-5678-7000-8000-123456789abd';

describe('UserImagesService: atualização e limpeza', () => {
  const repository = {
    withImage: vi.fn(),
    deleteUnreferenced: vi.fn(),
    findCleanupCandidates: vi.fn(),
  };
  const storage = { delete: vi.fn() };
  const updateUser = vi.fn();
  const config = { get: vi.fn().mockReturnValue('http://localhost:3000') };
  const service = new UserImagesService(
    repository as unknown as UserImagesRepository,
    storage as unknown as StorageService,
    { auth: { api: { updateUser } } } as unknown as AuthService,
    config as unknown as ConfigService<Environment, true>,
  );
  const currentSession = {
    ...authSession,
    user: { ...authSession.user, image: `http://localhost:3000/user-images/${oldId}` },
  };
  let image: UserImage;

  beforeEach(() => {
    vi.resetAllMocks();
    config.get.mockReturnValue('http://localhost:3000');
    image = {
      id,
      userId: authSession.user.id,
      importedKey: null,
      key: 'images/org-test/user-image/new',
      createdAt: new Date(),
      status: 'ready',
      contentType: 'image/png',
      size: 100,
    };
    repository.findCleanupCandidates.mockResolvedValue([]);
    repository.withImage.mockImplementation(async (_org, _id, action) => action(image));
    repository.deleteUnreferenced.mockResolvedValue(true);
    updateUser.mockResolvedValue({ response: { status: true }, headers: new Headers() });
  });

  it('vincula pelo Better Auth antes de tentar remover a foto anterior sem vínculo', async () => {
    await service.attach(id, 'Novo nome', currentSession, { cookie: 'session=example' });
    expect(repository.withImage).toHaveBeenCalledWith(
      authSession.user.id,
      id,
      expect.any(Function),
    );
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { name: 'Novo nome', image: `http://localhost:3000/user-images/${id}` },
      }),
    );
    expect(repository.deleteUnreferenced).toHaveBeenCalledWith(
      authSession.user.id,
      oldId,
      expect.any(Function),
      undefined,
    );
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      repository.deleteUnreferenced.mock.invocationCallOrder[0]!,
    );
  });

  it('mantém a foto anterior se a atualização do perfil falhar', async () => {
    updateUser.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(service.attach(id, 'Nome', currentSession, {})).rejects.toThrow();
    expect(repository.deleteUnreferenced).not.toHaveBeenCalled();
    expect(repository.findCleanupCandidates).not.toHaveBeenCalled();
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

  it('não vincula uma foto de outro usuário', async () => {
    repository.withImage.mockImplementationOnce(async (_user, _id, action) => action(undefined));
    await expect(service.attach(id, 'Nome', currentSession, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('permite remover a foto sem organização ativa', async () => {
    await service.remove(
      'Nome',
      {
        ...currentSession,
        session: { ...currentSession.session, activeOrganizationId: null },
      },
      {},
    );
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ body: { name: 'Nome', image: null } }),
    );
  });

  it('limpa por usuário apenas uploads anteriores a 24 horas com verificação de vínculo', async () => {
    repository.findCleanupCandidates.mockResolvedValue([{ id: oldId }]);
    const before = Date.now();
    await service.attach(
      id,
      'Nome',
      { ...currentSession, user: { ...currentSession.user, image: null } },
      {},
    );
    const cutoff = repository.findCleanupCandidates.mock.calls[0]![1] as Date;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before - 24 * 3600_000);
    expect(repository.findCleanupCandidates).toHaveBeenCalledExactlyOnceWith(
      authSession.user.id,
      cutoff,
    );
    expect(repository.deleteUnreferenced).toHaveBeenCalledWith(
      authSession.user.id,
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
      authSession.user.id,
      oldId,
      expect.any(Function),
      undefined,
    );
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      repository.deleteUnreferenced.mock.invocationCallOrder[0]!,
    );
  });

  it('preserva a foto quando a remoção do vínculo falha', async () => {
    updateUser.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(service.remove('Nome', currentSession, {})).rejects.toThrow();
    expect(repository.deleteUnreferenced).not.toHaveBeenCalled();
    expect(repository.findCleanupCandidates).not.toHaveBeenCalled();
  });
  it('dispara a limpeza de órfãs somente após vincular uma nova foto com sucesso', async () => {
    await service.attach(id, 'Nome', currentSession, {});
    expect(repository.findCleanupCandidates).toHaveBeenCalledOnce();
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      repository.findCleanupCandidates.mock.invocationCallOrder[0]!,
    );
  });

  it('não dispara a limpeza de órfãs ao remover a foto', async () => {
    await service.remove('Nome', currentSession, {});
    expect(repository.findCleanupCandidates).not.toHaveBeenCalled();
  });
  it('preserva o perfil salvo se a consulta de órfãs falhar', async () => {
    repository.findCleanupCandidates.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(service.attach(id, 'Nome', currentSession, {})).resolves.toMatchObject({
      response: { status: true },
    });
  });

  it('continua a limpeza do usuário quando a exclusão de um candidato falha', async () => {
    const otherId = '019a1234-5678-7000-8000-123456789abe';
    repository.findCleanupCandidates.mockResolvedValue([{ id: oldId }, { id: otherId }]);
    repository.deleteUnreferenced.mockRejectedValueOnce(new Error('Falha simulada'));
    const session = { ...currentSession, user: { ...currentSession.user, image: null } };
    await expect(service.attach(id, 'Nome', session, {})).resolves.toMatchObject({
      response: { status: true },
    });
    expect(repository.deleteUnreferenced).toHaveBeenCalledTimes(2);
    expect(repository.deleteUnreferenced).toHaveBeenLastCalledWith(
      authSession.user.id,
      otherId,
      expect.any(Function),
      expect.any(Date),
    );
  });
});
