import { Module } from '@nestjs/common';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { OrganizationRepository } from './organization.repository.js';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationRepository,
    OrganizationAccessService,
    OrganizationService,
  ],
  exports: [OrganizationAccessService],
})
export class OrganizationModule {}
