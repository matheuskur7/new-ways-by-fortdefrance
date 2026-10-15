import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { CreateCustomerDto } from './dto/create-customer.dto.js';
import type { UpdateCustomerDto } from './dto/update-customer.dto.js';

// Explicit allowlists prevent callers from overriding audit or tenant fields.
@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasMembership(organizationId: string, userId: string) {
    return Boolean(
      await this.prisma.member.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        select: { id: true },
      }),
    );
  }

  create(organizationId: string, dto: CreateCustomerDto) {
    const data = {
      name: dto.name,
      cpfCnpj: dto.cpfCnpj,
      phone: dto.phone,
      type: dto.type,
      organizationId,
    } satisfies Omit<
      Prisma.CustomerUncheckedCreateInput,
      'createdBy' | 'updatedBy'
    >;
    return this.prisma.customer.create({
      // Generated inputs require authors; the mandatory Prisma extension supplies them.
      data: data as Prisma.CustomerUncheckedCreateInput,
    });
  }

  async findOne(organizationId: string, id: string) {
    return this.prisma.customer.findUnique({
      where: { id, organizationId },
    });
  }

  update(organizationId: string, id: string, dto: UpdateCustomerDto) {
    const data: Prisma.CustomerUncheckedUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.cpfCnpj !== undefined ? { cpfCnpj: dto.cpfCnpj } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
    };
    return this.prisma.customer.update({
      where: { id, organizationId },
      data,
    });
  }
}
