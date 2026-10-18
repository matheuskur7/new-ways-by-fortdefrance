import { z } from 'zod';
import type { Request, Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { Session } from '../auth/session.decorator.js';
import type { AuthSession } from '../auth/auth.factory.js';
import {
  uploadImageSchema,
  uploadResponseSchema,
  imageResponseSchema,
  downloadResponseSchema,
  imageParamsSchema,
} from './dto/user-images.dto.js';
import type { UploadImageDto, ImageParamsDto } from './dto/user-images.dto.js';
import { UserImagesService } from './user-images.service.js';

const attachUserImageSchema = z.strictObject({ name: z.string().trim().min(1).max(200) });

@ApiTags('User images')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sessão ausente ou expirada.' })
@UseGuards(AuthGuard)
@Controller('user-images')
export class UserImagesController {
  constructor(@Inject(UserImagesService) private readonly images: UserImagesService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Solicitar upload de foto pessoal diretamente ao S3' })
  @ApiCreatedResponse({ standardSchema: uploadResponseSchema })
  createUpload(
    @Body({ schema: uploadImageSchema }) _body: UploadImageDto,
    @Session() session: AuthSession,
  ) {
    return this.images.createUpload(session);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirmar a foto pessoal após validar metadados no S3' })
  @ApiOkResponse({ standardSchema: imageResponseSchema })
  @ApiNotFoundResponse({ description: 'Foto não encontrada para este usuário.' })
  @ApiBadRequestResponse({ description: 'Upload ausente ou metadados incompatíveis.' })
  complete(
    @Param({ schema: imageParamsSchema }) params: ImageParamsDto,
    @Session() session: AuthSession,
  ) {
    return this.images.complete(params.id, session);
  }

  @Delete('current')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remover a foto do perfil e excluir o arquivo se estiver sem vínculo' })
  @ApiOkResponse({ standardSchema: z.object({ status: z.literal(true) }) })
  @ApiBadRequestResponse({ description: 'Nome inválido.' })
  async remove(
    @Body({ schema: attachUserImageSchema }) body: z.infer<typeof attachUserImageSchema>,
    @Session() session: AuthSession,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.images.remove(body.name, session, request.headers);
    for (const cookie of result.headers.getSetCookie()) response.append('Set-Cookie', cookie);
    return result.response;
  }

  @Post(':id/attach')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vincular foto pronta ao perfil e limpar a anterior sem vínculo' })
  @ApiOkResponse({ standardSchema: z.object({ status: z.literal(true) }) })
  @ApiNotFoundResponse({ description: 'Foto não encontrada para este usuário.' })
  @ApiBadRequestResponse({ description: 'Foto pendente, antiga ou entrada inválida.' })
  async attach(
    @Param({ schema: imageParamsSchema }) params: ImageParamsDto,
    @Body({ schema: attachUserImageSchema }) body: z.infer<typeof attachUserImageSchema>,
    @Session() session: AuthSession,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.images.attach(params.id, body.name, session, request.headers);
    for (const cookie of result.headers.getSetCookie()) response.append('Set-Cookie', cookie);
    return result.response;
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Obter URL de leitura da foto de usuário com validade de 12 horas' })
  @ApiOkResponse({ standardSchema: downloadResponseSchema })
  @ApiNotFoundResponse({ description: 'Foto não encontrada para este usuário.' })
  @ApiBadRequestResponse({ description: 'ID inválido ou upload ainda pendente.' })
  download(
    @Param({ schema: imageParamsSchema }) params: ImageParamsDto,
    @Session() session: AuthSession,
  ) {
    return this.images.createDownload(params.id, session);
  }
}
