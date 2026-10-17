import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module.js';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationRepository } from './organization.repository.js';

@Module({
  imports: [DatabaseModule],
  providers: [OrganizationAccessService, OrganizationRepository],
  exports: [OrganizationAccessService],
})
export class OrganizationModule {}
