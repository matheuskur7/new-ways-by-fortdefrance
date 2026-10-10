import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ImageResponse } from './responses/image-response.dto.js';
import { PaginatedImageResponse } from './responses/paginated-image-response.dto.js';
import { ErrorResponseDto } from '../../shared/http/error-response.dto.js';
import { ImageService } from './image.service.js';
import { CreateImageResponse } from './responses/create-image-response.dto.js';
import type { Image } from '../../generated/prisma/client.js';
import type { GetImageResponse } from './responses/get-image.response.dto.js';
import { ImageQueryDto } from './dto/image-query.dto.js';
import { ImageTagDto } from './dto/image-tag.dto.js';
import type { PaginatedResponse } from '../../shared/pagination/paginated-response.dto.js';

@ApiTags('Images')
@Controller(['image', 'car-image'])
export class ImageController {
  constructor(private readonly service: ImageService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria uma imagem e retorna URLs assinadas para upload e leitura.',
  })
  @ApiBody({ type: ImageTagDto })
  @ApiCreatedResponse({ type: CreateImageResponse })
  @ApiBadRequestResponse({
    description: 'Tag inválida ou campos não permitidos.',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Falha no banco ou armazenamento.',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: ImageTagDto): Promise<CreateImageResponse> {
    return this.service.create(dto.tag);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista imagens com paginação e filtro opcional por tag.',
  })
  @ApiOkResponse({ type: PaginatedImageResponse })
  @ApiBadRequestResponse({
    description: 'Página ou tag inválida.',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Falha no banco ou armazenamento.',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query() paginationQueryDto: ImageQueryDto,
  ): Promise<PaginatedResponse<GetImageResponse>> {
    return this.service.findAll(
      paginationQueryDto.page,
      paginationQueryDto.tag,
    );
  }

  @Get('unlinked')
  @ApiOperation({
    summary: 'Lista imagens sem ordem de serviço, com filtro opcional por tag.',
  })
  @ApiOkResponse({ type: PaginatedImageResponse })
  @ApiBadRequestResponse({
    description: 'Página ou tag inválida.',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Falha no banco ou armazenamento.',
    type: ErrorResponseDto,
  })
  async findAllUnlinked(
    @Query() paginationQueryDto: ImageQueryDto,
  ): Promise<PaginatedResponse<GetImageResponse>> {
    return this.service.findAllUnlinked(
      paginationQueryDto.page,
      paginationQueryDto.tag,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Exclui o objeto no S3 e seu registro.' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'ID da imagem (UUID v7).',
  })
  @ApiOkResponse({ type: ImageResponse })
  @ApiBadRequestResponse({
    description: 'ID deve ser UUID v7.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Imagem não encontrada.',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Falha no banco ou armazenamento.',
    type: ErrorResponseDto,
  })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Image> {
    return this.service.remove(id);
  }
}
