import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import type { AuthSession } from '../auth/auth.config.js';
import { OrganizationAccessService } from '../organization/organization-access.service.js';
import { CustomerRepository } from './customer.repository.js';
import type { CreateCustomerDto } from './dto/create-customer.dto.js';
import type { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomerService {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly organizationAccess: OrganizationAccessService,
  ) {}

  async create(session: AuthSession, dto: CreateCustomerDto) {
    const organizationId =
      await this.organizationAccess.requireActiveOrganization(session);
    try {
      return await this.repository.create(organizationId, dto);
    } catch (error) {
      this.rethrow(error);
    }
  }

  async findOne(session: AuthSession, id: string) {
    const organizationId =
      await this.organizationAccess.requireActiveOrganization(session);
    const customer = await this.repository.findOne(organizationId, id);
    if (!customer) throw new NotFoundException('Cliente não encontrado.');
    return customer;
  }

  async update(session: AuthSession, id: string, dto: UpdateCustomerDto) {
    const organizationId =
      await this.organizationAccess.requireActiveOrganization(session);
    if (
      ![dto.name, dto.cpfCnpj, dto.phone, dto.type].some(
        (value) => value !== undefined,
      )
    ) {
      throw new BadRequestException(
        'Informe ao menos um campo para atualizar.',
      );
    }
    try {
      return await this.repository.update(organizationId, id, dto);
    } catch (error) {
      this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictException('CPF/CNPJ já cadastrado nesta empresa.');
      if (error.code === 'P2025')
        throw new NotFoundException('Cliente não encontrado.');
    }
    throw error;
  }
}
