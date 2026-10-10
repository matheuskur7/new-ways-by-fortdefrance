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
import { CarImageService } from './car-image.service.js';
import { CreateCarImageResponse } from './responses/create-car-image-response.dto.js';
import type { CarImage } from '../../generated/prisma/client.js';
import { GetCarImageResponse } from './responses/get-car-image.response.dto.js';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto.js';
import { PaginatedResponse } from '../../shared/pagination/paginated-response.dto.js';

@Controller('car-image')
export class CarImageController {
  constructor(private readonly service: CarImageService) {}

  @Post()
  async create(): Promise<CreateCarImageResponse> {
    return this.service.create();
  }

  @Get()
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<PaginatedResponse<GetCarImageResponse>> {
    return this.service.findAll(paginationQueryDto.page);
  }

  @Get('unlinked')
  async findAllUnlinked(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<PaginatedResponse<GetCarImageResponse>> {
    return this.service.findAllUnlinked(paginationQueryDto.page);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<CarImage> {
    return this.service.remove(id);
  }

  @Patch('/category/key/:key')
  setCategory(
    @Param('key') key: string,
    @Body('category') category: string,
  ): CarImage | string {
    return 'alterado key: ' + key + '     para a category: ' + category;
  }
}
