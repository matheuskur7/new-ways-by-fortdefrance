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

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateCustomerDto,
  ) {
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        cpfCnpj: dto.cpfCnpj,
        phone: dto.phone,
        type: dto.type,
        organizationId,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    return this.prisma.customer.findUnique({
      where: { id, organizationId },
    });
  }

  async update(
    organizationId: string,
    actorId: string,
    id: string,
    dto: UpdateCustomerDto,
  ) {
    const data: Prisma.CustomerUncheckedUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.cpfCnpj !== undefined ? { cpfCnpj: dto.cpfCnpj } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      updatedBy: actorId,
    };
    const args = {
      where: { id, organizationId },
      data,
    } as const;
    return this.prisma.customer.update(args);
  }
}
