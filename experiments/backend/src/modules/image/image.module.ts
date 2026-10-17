import { Module } from '@nestjs/common';
import { ImageService } from './image.service.js';
import { ImageController } from './image.controller.js';
import { StorageModule } from '../../shared/storage/storage.module.js';
import { ImageRepository } from './image.repository.js';

@Module({
  imports: [StorageModule],
  controllers: [ImageController],
  providers: [ImageService, ImageRepository],
  exports: [ImageService],
})
export class ImageModule {}
