import { Controller, Get, Header, Inject, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CardFeesService } from './card-fees.service.js';
import { cardFeeGroupsSchema } from './dto/card-fees.dto.js';
@ApiTags('Taxas de cartão')
@ApiCookieAuth()
@UseGuards(AuthGuard)
@Controller('card-fees')
export class CardFeesController {
  constructor(@Inject(CardFeesService) private readonly service: CardFeesService) {}
  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOkResponse({ standardSchema: cardFeeGroupsSchema })
  findAll() {
    return this.service.findAll();
  }
}
