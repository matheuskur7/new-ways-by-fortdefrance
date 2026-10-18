import type { AuthSession } from '../auth/auth.factory.js';
import { OrganizationAccessService } from '../organization/organization-access.service.js';
import { Inject, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../shared/config/env.js';
import type { Image } from '../../shared/database/schemas/index.js';
import { inspectUploadedObject } from '../../shared/storage/inspect-uploaded-object.js';
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
    @Inject(OrganizationAccessService)
    private readonly organizations: OrganizationAccessService,
  ) {}

  async createUpload(dto: UploadImageDto, session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const image = await this.repository.create(organizationId, dto.key);
    const url = await this.storage.presignUpload(image.key);
    return {
      id: image.id,
      key: image.key,
      status: 'pending' as const,
      url,
      method: 'PUT' as const,
      expiresIn: this.storage.expiresIn,
      headers: this.storage.uploadHeaders,
    };
  }

  async complete(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const image = await this.requireImage(organizationId, id);
    if (image.status === 'ready') return this.toResponse(image);
    const { contentType, size } = await inspectUploadedObject(this.storage, image.key);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!contentType || !allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        'O arquivo enviado deve ser uma imagem JPEG, PNG, WebP ou GIF.',
      );
    }
    if (
      size === undefined ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > this.config.get('MAX_IMAGE_SIZE_BYTES', { infer: true })
    ) {
      throw new BadRequestException('Imagem vazia ou acima do tamanho permitido.');
    }
    const ready = await this.repository.markReady(organizationId, id, {
      contentType,
      size,
    });
    if (!ready) throw new NotFoundException('Imagem não encontrada.');
    return this.toResponse(ready);
  }

  async createDownload(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const image = await this.requireImage(organizationId, id);
    if (image.status !== 'ready') {
      throw new BadRequestException('O upload da imagem ainda não foi confirmado.');
    }
    return {
      url: await this.storage.presignDownload(image.key),
      expiresIn: this.storage.expiresIn,
    };
  }

  private async requireImage(organizationId: string, id: string) {
    const image = await this.repository.findById(organizationId, id);
    if (!image) throw new NotFoundException('Imagem não encontrada.');
    return image;
  }

  private toResponse(image: Image) {
    return {
      id: image.id,
      key: image.key,
      contentType: image.contentType,
      size: image.size,
      status: image.status,
    };
  }
}
