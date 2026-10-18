import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { AdminSeedService } from './admin-seed.service.js';

@Module({
  providers: [DatabaseService, AdminSeedService],
  exports: [DatabaseService, AdminSeedService],
})
export class DatabaseModule {}
