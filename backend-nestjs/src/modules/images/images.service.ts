import { randomUUID } from 'node:crypto';
import {
  Inject,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3ServiceException } from '@aws-sdk/client-s3';
import type { Environment } from '../../shared/config/env.js';
import type { Image } from '../../shared/database/schemas/index.js';
import { StorageService } from '../../shared/storage/storage.service.js';
import { ImagesRepository } from './images.repository.js';
import type { UploadImageDto } from './dto/images.dto.js';

@Injectable()
export class ImagesService {
  constructor(
    @Inject(ImagesRepository) private readonly repository: ImagesRepository,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(ConfigService)
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async createUpload(dto: UploadImageDto) {
    if (dto.size > this.config.get('MAX_IMAGE_SIZE_BYTES', { infer: true })) {
      throw new BadRequestException('Imagem excede o tamanho permitido.');
    }
    const id = randomUUID();
    const key = `images/${id}`;
    const url = await this.storage.presignUpload(
      key,
      dto.contentType,
      dto.size,
      dto.checksum,
    );
    await this.repository.create({ id, key, ...dto });
    return {
      id,
      url,
      method: 'PUT' as const,
      expiresIn: this.storage.expiresIn,
      headers: {
        'Content-Type': dto.contentType,
        'Content-Length': String(dto.size),
        'x-amz-checksum-sha256': dto.checksum,
      },
    };
  }

  async complete(id: string) {
    const image = await this.requireImage(id);
    if (image.status === 'ready') return this.toResponse(image);
    let object;
    try {
      object = await this.storage.head(image.key);
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        throw new BadRequestException('Upload ainda não encontrado no S3.');
      }
      throw error;
    }
    if (
      object.ContentLength !== image.size ||
      object.ContentType !== image.contentType ||
      object.ChecksumSHA256 !== image.checksum
    ) {
      throw new BadRequestException(
        'Metadados do objeto não correspondem ao upload solicitado.',
      );
    }
    const ready = await this.repository.markReady(id);
    if (!ready) throw new NotFoundException('Imagem não encontrada.');
    return this.toResponse(ready);
  }

  async createDownload(id: string) {
    const image = await this.requireImage(id);
    if (image.status !== 'ready') {
      throw new BadRequestException(
        'O upload da imagem ainda não foi confirmado.',
      );
    }
    return {
      url: await this.storage.presignDownload(image.key),
      expiresIn: this.storage.expiresIn,
    };
  }

  private async requireImage(id: string) {
    const image = await this.repository.findById(id);
    if (!image) throw new NotFoundException('Imagem não encontrada.');
    return image;
  }

  private toResponse(image: Image) {
    return {
      id: image.id,
      filename: image.filename,
      contentType: image.contentType,
      size: image.size,
      status: image.status,
    };
  }
}
