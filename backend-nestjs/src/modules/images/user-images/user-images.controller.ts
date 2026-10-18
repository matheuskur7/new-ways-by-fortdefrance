import { z } from 'zod';
import type { Request, Response } from 'express';
import { UserImageLifecycleService } from './user-image-lifecycle.service.js';
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
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard.js';
import { Session } from '../../auth/session.decorator.js';
import type { AuthSession } from '../../auth/auth.factory.js';
import { downloadResponseSchema, imageParamsSchema } from '../dto/images.dto.js';
import type { ImageParamsDto } from '../dto/images.dto.js';
import { UserImagesService } from './user-images.service.js';

const attachUserImageSchema = z.strictObject({ name: z.string().trim().min(1).max(200) });

@ApiTags('User images')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sessão ausente ou expirada.' })
@ApiForbiddenResponse({ description: 'Organização ativa ausente ou sem vínculo.' })
@UseGuards(AuthGuard)
@Controller('images/user-images')
export class UserImagesController {
  constructor(
    @Inject(UserImagesService) private readonly images: UserImagesService,
    @Inject(UserImageLifecycleService) private readonly lifecycle: UserImageLifecycleService,
  ) {}

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
    const result = await this.lifecycle.remove(body.name, session, request.headers);
    for (const cookie of result.headers.getSetCookie()) response.append('Set-Cookie', cookie);
    return result.response;
  }

  @Post(':id/attach')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vincular foto pronta ao perfil e limpar a anterior sem vínculo' })
  @ApiOkResponse({ standardSchema: z.object({ status: z.literal(true) }) })
  @ApiNotFoundResponse({ description: 'Foto não encontrada na organização ativa.' })
  @ApiBadRequestResponse({ description: 'Foto pendente, antiga ou entrada inválida.' })
  async attach(
    @Param({ schema: imageParamsSchema }) params: ImageParamsDto,
    @Body({ schema: attachUserImageSchema }) body: z.infer<typeof attachUserImageSchema>,
    @Session() session: AuthSession,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.lifecycle.attach(params.id, body.name, session, request.headers);
    for (const cookie of result.headers.getSetCookie()) response.append('Set-Cookie', cookie);
    return result.response;
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Obter URL de leitura da foto de usuário com validade de 12 horas' })
  @ApiOkResponse({ standardSchema: downloadResponseSchema })
  @ApiNotFoundResponse({ description: 'Foto não encontrada na organização ativa.' })
  @ApiBadRequestResponse({ description: 'ID inválido ou upload ainda pendente.' })
  download(
    @Param({ schema: imageParamsSchema }) params: ImageParamsDto,
    @Session() session: AuthSession,
  ) {
    return this.images.createDownload(params.id, session);
  }
}
