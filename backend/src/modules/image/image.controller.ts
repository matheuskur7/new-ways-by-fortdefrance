import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ImageService } from './image.service.js';
import type { CreateImageResponse } from './responses/create-image-response.dto.js';
import type { Image } from '../../generated/prisma/client.js';
import type { GetImageResponse } from './responses/get-image.response.dto.js';
import { ImageQueryDto } from './dto/image-query.dto.js';
import { ImageTagDto } from './dto/image-tag.dto.js';
import type { PaginatedResponse } from '../../shared/pagination/paginated-response.dto.js';

@Controller(['image', 'car-image'])
export class ImageController {
  constructor(private readonly service: ImageService) {}

  @Post()
  async create(@Body() dto: ImageTagDto): Promise<CreateImageResponse> {
    return this.service.create(dto.tag);
  }

  @Get()
  async findAll(
    @Query() paginationQueryDto: ImageQueryDto,
  ): Promise<PaginatedResponse<GetImageResponse>> {
    return this.service.findAll(
      paginationQueryDto.page,
      paginationQueryDto.tag,
    );
  }

  @Get('unlinked')
  async findAllUnlinked(
    @Query() paginationQueryDto: ImageQueryDto,
  ): Promise<PaginatedResponse<GetImageResponse>> {
    return this.service.findAllUnlinked(
      paginationQueryDto.page,
      paginationQueryDto.tag,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Image> {
    return this.service.remove(id);
  }

  @Patch('/category/key/:key')
  setCategory(
    @Param('key') key: string,
    @Body('category') category: string,
  ): Image | string {
    return 'alterado key: ' + key + '     para a category: ' + category;
  }
}
