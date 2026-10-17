import { AuthGuard } from '../auth/auth.guard.js';
import { Session } from '../auth/session.decorator.js';
import type { AuthSession } from '../auth/auth.factory.js';
import { Inject, UseGuards, Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ImagesService } from './images.service.js';
import {
  downloadResponseSchema,
  imageParamsSchema,
  imageResponseSchema,
  uploadImageSchema,
  uploadResponseSchema,
} from './dto/images.dto.js';
import type { ImageParamsDto, UploadImageDto } from './dto/images.dto.js';

@ApiTags('Images')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sessão ausente ou expirada.' })
@ApiForbiddenResponse({
  description: 'Organização ativa ausente ou sem vínculo.',
})
@UseGuards(AuthGuard)
@ApiBadRequestResponse({
  description: 'Entrada inválida ou upload incompatível.',
})
@Controller('images')
export class ImagesController {
  constructor(@Inject(ImagesService) private readonly images: ImagesService) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Solicitar URL para enviar imagem diretamente ao S3',
  })
  @ApiCreatedResponse({ standardSchema: uploadResponseSchema })
  createUpload(
    @Body({ schema: uploadImageSchema }) body: UploadImageDto,
    @Session() session: AuthSession,
  ) {
    return this.images.createUpload(body, session);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirmar upload verificando os metadados no S3' })
  @ApiOkResponse({ standardSchema: imageResponseSchema })
  @ApiNotFoundResponse({ description: 'Imagem não encontrada.' })
  complete(
    @Param({ schema: imageParamsSchema }) params: ImageParamsDto,
    @Session() session: AuthSession,
  ) {
    return this.images.complete(params.id, session);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Obter URL temporária para leitura direta no S3' })
  @ApiOkResponse({ standardSchema: downloadResponseSchema })
  @ApiNotFoundResponse({ description: 'Imagem não encontrada.' })
  download(
    @Param({ schema: imageParamsSchema }) params: ImageParamsDto,
    @Session() session: AuthSession,
  ) {
    return this.images.createDownload(params.id, session);
  }
}
