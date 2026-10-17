import { CustomerRepository } from '../../../../src/modules/customer/customer.repository.js';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';

describe('CustomerRepository audit and tenant boundaries (mocked database)', () => {
  const prisma = {
    customer: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  };
  const repository = new CustomerRepository(prisma as unknown as PrismaService);
  const dto = {
    name: 'Cliente',
    cpfCnpj: '12345678901',
    phone: '11999999999',
    type: 'PERSON' as const,
  };
  const row = { id: 'customer', createdBy: 'alice' };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.customer.create.mockResolvedValue(row);
    prisma.customer.update.mockResolvedValue(row);
  });

  it('ignores forged actor, company and legacy owner fields even from internal callers', async () => {
    await repository.create('company-a', {
      ...dto,
      createdBy: 'mallory',
      updatedBy: 'mallory',
      organizationId: 'company-b',
      userId: 'mallory',
    } as typeof dto);
    expect(prisma.customer.create).toHaveBeenCalledWith({
      data: {
        ...dto,

        organizationId: 'company-a',
      },
    });
  });

  it('reads customers only from the active company', async () => {
    prisma.customer.findUnique.mockResolvedValue(row);
    expect(await repository.findOne('company-a', 'customer')).toEqual(row);
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: 'customer', organizationId: 'company-a' },
    });
  });

  it('preserves the creator and tenant when only the name changes', async () => {
    await repository.update('company-a', 'customer', {
      name: 'Novo',
      createdBy: 'mallory',
      organizationId: 'company-b',
    } as { name: string });
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'customer', organizationId: 'company-a' },
      data: { name: 'Novo' },
    });
  });
});
