import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { InitialSeedService } from './initial-seed.service.js';

@Module({
  providers: [DatabaseService, InitialSeedService],
  exports: [DatabaseService, InitialSeedService],
})
export class DatabaseModule {}
