import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '../../config/env.js';
import { DatabaseModule } from '../database.module.js';
import { InitialSeedService } from './initial-seed.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      skipProcessEnv: true,
      validate: validateEnv,
    }),
    DatabaseModule,
  ],
  providers: [InitialSeedService],
})
export class SeedsModule {}
