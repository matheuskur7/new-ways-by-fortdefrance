import { Module } from '@nestjs/common';
import { OrganizationModule } from '../organization/organization.module.js';
import { CustomerController } from './customer.controller.js';
import { CustomerRepository } from './customer.repository.js';
import { CustomerService } from './customer.service.js';

@Module({
  imports: [OrganizationModule],
  controllers: [CustomerController],
  providers: [CustomerRepository, CustomerService],
})
export class CustomerModule {}
