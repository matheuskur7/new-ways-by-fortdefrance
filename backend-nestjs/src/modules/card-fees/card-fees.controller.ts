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
  taxBrandsSchema,
  reorderBrandsSchema,
  cardFeeIdParamsSchema,
  providerInputSchema,
  brandInputSchema,
  providerResponseSchema,
  brandResponseSchema,
  catalogResponseSchema,
} from './dto/card-fees.dto.js';
import type {
  ProviderInput,
  ReorderBrandsInput,
  BrandInput,
  CardFeeIdParams,
} from './dto/card-fees.dto.js';

@ApiTags('Taxas de cartão')
@ApiCookieAuth()
@UseGuards(AuthGuard)
@Controller('card-fees')
export class CardFeesController {
  constructor(@Inject(CardFeesService) private readonly service: CardFeesService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOkResponse({ standardSchema: taxBrandsSchema })
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

  @Post('brands')
  @ApiCreatedResponse({ standardSchema: brandResponseSchema })
  createBrand(
    @Body({ schema: brandInputSchema }) body: BrandInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveBrand(body, session);
  }

  @Patch('brands/:id')
  @ApiOkResponse({ standardSchema: brandResponseSchema })
  updateBrand(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Body({ schema: brandInputSchema }) body: BrandInput,
    @Session() session: AuthSession,
  ) {
    return this.service.saveBrand(body, session, params.id);
  }

  @Patch('providers/:id/brands/order')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Ordem das bandeiras atualizada.' })
  @ApiConflictResponse({ description: 'A lista de bandeiras mudou.' })
  reorderBrands(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Body({ schema: reorderBrandsSchema }) body: ReorderBrandsInput,
    @Session() session: AuthSession,
  ) {
    return this.service.reorderBrands(params.id, body.brandIds, session);
  }

  @Delete('providers/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Provedor removido.' })
  @ApiConflictResponse({ description: 'O provedor ainda possui bandeiras.' })
  removeProvider(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Session() session: AuthSession,
  ) {
    return this.service.removeProvider(params.id, session);
  }

  @Delete('brands/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Bandeira e suas taxas removidas.' })
  removeBrand(
    @Param({ schema: cardFeeIdParamsSchema }) params: CardFeeIdParams,
    @Session() session: AuthSession,
  ) {
    return this.service.removeBrand(params.id, session);
  }
}
