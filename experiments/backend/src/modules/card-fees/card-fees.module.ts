import { Module } from '@nestjs/common';
import { CardFeesController } from './card-fees.controller.js';
import { CardFeesRepository } from './card-fees.repository.js';
import { CardFeesService } from './card-fees.service.js';

@Module({
  controllers: [CardFeesController],
  providers: [CardFeesRepository, CardFeesService],
})
export class CardFeesModule {}
