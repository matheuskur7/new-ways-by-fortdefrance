import { Module } from '@nestjs/common';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationRepository } from './organization.repository.js';

@Module({
  providers: [OrganizationRepository, OrganizationAccessService],
  exports: [OrganizationAccessService],
})
export class OrganizationModule {}
