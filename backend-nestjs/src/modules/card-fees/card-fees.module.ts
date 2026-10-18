import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../../shared/database/database.module.js';
import { CardFeesController } from './card-fees.controller.js';
import { CardFeesService } from './card-fees.service.js';
import { CardFeesRepository } from './card-fees.repository.js';
@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CardFeesController],
  providers: [CardFeesService, CardFeesRepository],
})
export class CardFeesModule {}
