import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../src/generated/prisma/client.js';
import type { AuthSession } from '../../../../src/modules/auth/auth.config.js';
import { CustomerRepository } from '../../../../src/modules/customer/customer.repository.js';
import { CustomerService } from '../../../../src/modules/customer/customer.service.js';

describe('CustomerService (mocked database)', () => {
  const repository = {
    hasMembership: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };
  const session = {
    user: { id: 'alice' },
    session: { activeOrganizationId: 'company-a' },
  } as AuthSession;
  const dto = {
    name: 'Cliente',
    cpfCnpj: '12345678901',
    phone: '11999999999',
    type: 'PERSON' as const,
  };
  const service = new CustomerService(
    repository as unknown as CustomerRepository,
  );
  beforeEach(() => {
    vi.resetAllMocks();
    repository.hasMembership.mockResolvedValue(true);
  });

  it('derives both tenant and actor from the validated session', async () => {
    await service.create(session, dto);
    expect(repository.hasMembership).toHaveBeenCalledWith('company-a', 'alice');
    expect(repository.create).toHaveBeenCalledWith('company-a', 'alice', dto);
  });

  it('rechecks membership for every write, including a stale active company', async () => {
    repository.hasMembership.mockResolvedValue(false);
    await expect(service.create(session, dto)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      service.update(session, 'id', { name: 'Outro' }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('requires an active company before accessing customers', async () => {
    const noCompany = {
      ...session,
      session: { ...session.session, activeOrganizationId: null },
    };
    await expect(service.findOne(noCompany, 'id')).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('scopes reads to the active company and hides missing or foreign records', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(session, 'foreign-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findOne).toHaveBeenCalledWith('company-a', 'foreign-id');
  });

  it('passes the editing user from the session and rejects empty patches', async () => {
    const editor = { ...session, user: { ...session.user, id: 'bob' } };
    await service.update(editor, 'id', { name: 'Novo nome' });
    expect(repository.update).toHaveBeenCalledWith('company-a', 'bob', 'id', {
      name: 'Novo nome',
    });
    repository.update.mockClear();
    await expect(service.update(session, 'id', {})).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('translates duplicate documents in the same company to a conflict', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(service.create(session, dto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('does not expose a customer from another company on update', async () => {
    repository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.update(session, 'foreign-id', { name: 'Novo' }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.update).toHaveBeenCalledWith(
      'company-a',
      'alice',
      'foreign-id',
      { name: 'Novo' },
    );
  });
});
