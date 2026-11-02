import {
  Body,
  Controller,
  Get,
  Delete,
  HttpCode,
  Header,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiConflictResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { Session } from '../auth/session.decorator.js';
import type { AuthSession } from '../auth/auth.factory.js';
import { CardFeesService } from './card-fees.service.js';
import {
  cardFeeGroupsSchema,
  reorderGroupsSchema,
  cardFeeIdParamsSchema,
  cardFeeGroupParamsSchema,
  cardFeeRateParamsSchema,
  providerInputSchema,
  groupInputSchema,
  rateInputSchema,
  providerResponseSchema,
  groupResponseSchema,
  rateResponseSchema,
  catalogResponseSchema,
} from './dto/card-fees.dto.js';
import type {
  ProviderInput,
  ReorderGroupsInput,
  GroupInput,
  RateInput,
  CardFeeIdParams,
  CardFeeGroupParams,
  CardFeeRateParams,
} from './dto/card-fees.dto.js';

@ApiTags('Taxas de cartão')
@ApiCookieAuth()
@UseGuards(AuthGuard)
@Controller('card-fees')
export class CardFeesController {
  constructor(@Inject(CardFeesService) private readonly service: CardFeesService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOkResponse({ standardSchema: cardFeeGroupsSchema })
  findAll(@Session() session: AuthSession) {
    return this.service.findAll(session);
  }

  @Get('catalog')
  @Header('Cache-Control', 'private, no-store')
  @ApiOkResponse({ standardSchema: catalogResponseSchema })
  catalog(@Session() session: AuthSession) {
    return this.service.catalog(session);
  }

  @Post('providers')
  @ApiCreatedResponse({ standardSchema: providerResponseSchema })
  createProvider(
    @Body({ schema: providerInputSchema }) body: ProviderInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveProvider(body, session);
  }

  @Patch('providers/:id')
  @ApiOkResponse({ standardSchema: providerResponseSchema })
  updateProvider(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Body({ schema: providerInputSchema }) body: ProviderInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveProvider(body, session, params.id);
  }

  @Post('groups')
  @ApiCreatedResponse({ standardSchema: groupResponseSchema })
  createGroup(
    @Body({ schema: groupInputSchema }) body: GroupInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveGroup(body, session);
  }

  @Patch('groups/:id')
  @ApiOkResponse({ standardSchema: groupResponseSchema })
  updateGroup(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Body({ schema: groupInputSchema }) body: GroupInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveGroup(body, session, params.id);
  }

  @Patch('providers/:id/groups/order')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Ordem dos grupos atualizada.' })
  @ApiConflictResponse({ description: 'A lista de grupos mudou.' })
  reorderGroups(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Body({ schema: reorderGroupsSchema }) body: ReorderGroupsInput,
    @Session() session: AuthSession,
  ) {
    return this.service.reorderGroups(params.id, body.groupIds, session);
  }

  @Delete('providers/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Provedor removido.' })
  @ApiConflictResponse({ description: 'O provedor ainda possui grupos.' })
  removeProvider(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Session() session: AuthSession,
  ) {
    return this.service.removeProvider(params.id, session);
  }

  @Delete('groups/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Grupo e suas taxas removidos.' })
  removeGroup(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Session() session: AuthSession,
  ) {
    return this.service.removeGroup(params.id, session);
  }

  @Post('groups/:groupId/rates')
  @ApiCreatedResponse({ standardSchema: rateResponseSchema })
  createRate(
    @Param({ schema: cardFeeGroupParamsSchema }) params: CardFeeGroupParams,
    @Body({ schema: rateInputSchema }) body: RateInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveRate(params.groupId, body, session);
  }

  @Patch('groups/:groupId/rates/:id')
  @ApiOkResponse({ standardSchema: rateResponseSchema })
  updateRate(
    @Param({ schema: cardFeeRateParamsSchema }) params: CardFeeRateParams,
    @Body({ schema: rateInputSchema }) body: RateInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveRate(params.groupId, body, session, params.id);
  }
}
