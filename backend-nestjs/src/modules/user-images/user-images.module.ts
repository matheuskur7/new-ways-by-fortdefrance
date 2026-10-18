import { UserImagesRepository } from './user-images.repository.js';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module.js';
import { StorageModule } from '../../shared/storage/storage.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UserImagesService } from './user-images.service.js';
import { UserImagesController } from './user-images.controller.js';

@Module({
  imports: [DatabaseModule, StorageModule, AuthModule],
  providers: [UserImagesService, UserImagesRepository],
  controllers: [UserImagesController],
})
export class UserImagesModule {}
