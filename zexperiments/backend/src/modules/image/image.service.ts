import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../shared/storage/storage.service.js';
import { v7 as uuidv7 } from 'uuid';
import { ImageRepository } from './image.repository.js';
import type { CreateImageResponse } from './responses/create-image-response.dto.js';
import type { GetImageResponse } from './responses/get-image.response.dto.js';
import type { Image } from '../../generated/prisma/client.js';
import {
  createPaginatedResponse,
  type PaginatedResponse,
} from '../../shared/pagination/paginated-response.dto.js';
import { getPaginationParams } from '../../shared/pagination/pagination.js';

const IMAGE_PAGE_SIZE = 50;

@Injectable()
export class ImageService {
  constructor(
    private readonly storageService: StorageService,
    private readonly repository: ImageRepository,
  ) {}

  async create(tag: string): Promise<CreateImageResponse> {
    const newKey = tag + '/' + uuidv7();
    const newImage = await this.repository.create(newKey, tag);
    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      newKey,
      'image/*',
      300,
    );

    return { imageData: await this.toGetResponse(newImage), uploadUrl };
  }

  async findAll(
    page: number,
    tag?: string,
  ): Promise<PaginatedResponse<GetImageResponse>> {
    return this.findPage(page, tag, false);
  }

  async findAllUnlinked(
    page: number,
    tag?: string,
  ): Promise<PaginatedResponse<GetImageResponse>> {
    return this.findPage(page, tag, true);
  }

  private async findPage(
    page: number,
    tag: string | undefined,
    onlyUnlinked: boolean,
  ): Promise<PaginatedResponse<GetImageResponse>> {
    const pagination = getPaginationParams(page, IMAGE_PAGE_SIZE);
    const { data, total } = onlyUnlinked
      ? await this.repository.findAllUnlinked(pagination, tag)
      : await this.repository.findAll(pagination, tag);
    const images = await Promise.all(
      data.map((image) => this.toGetResponse(image)),
    );

    return createPaginatedResponse(
      images,
      pagination.page,
      pagination.perPage,
      total,
    );
  }

  async remove(id: string): Promise<Image> {
    const image = await this.repository.findOne(id);
    if (!image) throw new NotFoundException('Imagem não encontrada.');

    await this.storageService.delete(image.key);
    return this.repository.remove(id);
  }

  private async toGetResponse(image: Image): Promise<GetImageResponse> {
    return {
      ...image,
      url: await this.storageService.getPresignedUrl(image.key, 900),
    };
  }
}
