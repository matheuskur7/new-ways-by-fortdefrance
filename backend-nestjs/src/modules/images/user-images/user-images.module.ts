import { UserImagesRepository } from './user-images.repository.js';
import { UserImageLifecycleService } from './user-image-lifecycle.service.js';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../shared/database/database.module.js';
import { StorageModule } from '../../../shared/storage/storage.module.js';
import { AuthModule } from '../../auth/auth.module.js';
import { OrganizationModule } from '../../organization/organization.module.js';
import { ImagesRepository } from '../images.repository.js';
import { UserImagesService } from './user-images.service.js';
import { UserImagesController } from './user-images.controller.js';

@Module({
  imports: [DatabaseModule, StorageModule, AuthModule, OrganizationModule],
  providers: [ImagesRepository, UserImagesService, UserImagesRepository, UserImageLifecycleService],
  controllers: [UserImagesController],
})
export class UserImagesModule {}
