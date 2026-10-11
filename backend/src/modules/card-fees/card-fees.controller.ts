import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CardFeesService } from './card-fees.service.js';
import { GetCardFeeGroupResponseDto } from './dto/get-card-fee-group.response.dto.js';

@ApiTags('Taxas de cartão')
@ApiCookieAuth()
@ApiUnauthorizedResponse({
  description: 'Sessão ausente, expirada ou inválida.',
})
@Controller('api/card-fees')
export class CardFeesController {
  constructor(private readonly service: CardFeesService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Consultar grupos e taxas de cartão' })
  @ApiOkResponse({ type: GetCardFeeGroupResponseDto, isArray: true })
  findAll(): Promise<GetCardFeeGroupResponseDto[]> {
    return this.service.findAll();
  }
}
