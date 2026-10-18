import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module.js';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationRepository } from './organization.repository.js';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [OrganizationAccessService, OrganizationRepository, OrganizationService],
  exports: [OrganizationAccessService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
