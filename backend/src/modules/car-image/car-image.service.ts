import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../shared/storage/storage.service.js';
import { v7 as uuidv7 } from 'uuid';
import { CarImageRepository } from './car-image.repository.js';
import { CreateCarImageResponse } from './responses/create-car-image-response.dto.js';
import { GetCarImageResponse } from './responses/get-car-image.response.dto.js';
import type { CarImage } from '../../generated/prisma/client.js';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from '../../shared/pagination/paginated-response.dto.js';
import { getPaginationParams } from '../../shared/pagination/pagination.js';

const CAR_IMAGE_PAGE_SIZE = 50;

@Injectable()
export class CarImageService {
  constructor(
    private readonly storageService: StorageService,
    private readonly repository: CarImageRepository,
  ) {}

  async create(): Promise<CreateCarImageResponse> {
    const newKey = 'car-image/' + uuidv7();
    const newImage = await this.repository.create(newKey);
    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      newKey,
      'image/*',
      300,
    );

    return { imageData: await this.toGetResponse(newImage), uploadUrl };
  }

  async findAll(page: number): Promise<PaginatedResponse<GetCarImageResponse>> {
    const pagination = getPaginationParams(page, CAR_IMAGE_PAGE_SIZE);
    const { data, total } = await this.repository.findAll(pagination);
    const images = await this.toGetResponseList(data);

    return createPaginatedResponse(
      images,
      pagination.page,
      pagination.perPage,
      total,
    );
  }

  async findAllUnlinked(
    page: number,
  ): Promise<PaginatedResponse<GetCarImageResponse>> {
    const pagination = getPaginationParams(page, CAR_IMAGE_PAGE_SIZE);
    const { data, total } = await this.repository.findAllUnlinked(pagination);
    const images = await this.toGetResponseList(data);

    return createPaginatedResponse(
      images,
      pagination.page,
      pagination.perPage,
      total,
    );
  }

  async remove(id: string): Promise<CarImage> {
    const image = await this.repository.findOne(id);
    if (!image) throw new NotFoundException('Imagem não encontrada.');

    await this.storageService.delete(image.key);
    return this.repository.remove(id);
  }

  async toGetResponse(image: CarImage): Promise<GetCarImageResponse> {
    return {
      ...image,
      url: await this.storageService.getPresignedUrl(image.key, 900),
    };
  }

  async toGetResponseList(images: CarImage[]): Promise<GetCarImageResponse[]> {
    return Promise.all(images.map((image) => this.toGetResponse(image)));
  }
}
