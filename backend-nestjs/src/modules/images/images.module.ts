import { AuthModule } from '../auth/auth.module.js';
import { OrganizationModule } from '../organization/organization.module.js';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module.js';
import { StorageModule } from '../../shared/storage/storage.module.js';
import { ImagesController } from './images.controller.js';
import { ImagesRepository } from './images.repository.js';
import { ImagesService } from './images.service.js';

@Module({
  imports: [DatabaseModule, StorageModule, AuthModule, OrganizationModule],
  controllers: [ImagesController],
  providers: [ImagesService, ImagesRepository],
  exports: [ImagesService],
})
export class ImagesModule {}
