import { Module } from '@nestjs/common';
import { CarImageService } from './car-image.service.js';
import { CarImageController } from './car-image.controller.js';
import { StorageModule } from '../../shared/storage/storage.module.js';
import { PrismaService } from '../../shared/db/prisma.service.js';
import { CarImageRepository } from './car-image.repository.js';

@Module({
  imports: [StorageModule],
  controllers: [CarImageController],
  providers: [CarImageService, CarImageRepository, PrismaService],
  exports: [CarImageService],
})
export class CarImageModule {}
