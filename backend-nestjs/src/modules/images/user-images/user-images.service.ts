import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthSession } from '../../auth/auth.factory.js';
import { OrganizationAccessService } from '../../organization/organization-access.service.js';
import { StorageService } from '../../../shared/storage/storage.service.js';
import { ImagesRepository } from '../images.repository.js';

export const USER_IMAGE_URL_TTL_SECONDS = 12 * 60 * 60;

@Injectable()
export class UserImagesService {
  constructor(
    @Inject(ImagesRepository) private readonly repository: ImagesRepository,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(OrganizationAccessService) private readonly organizations: OrganizationAccessService,
  ) {}

  async createDownload(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const image = await this.repository.findById(organizationId, id);
    if (!image || image.keyPrefix !== 'user-image')
      throw new NotFoundException('Foto de usuário não encontrada.');
    if (image.status !== 'ready')
      throw new BadRequestException('O upload da foto ainda não foi confirmado.');
    return {
      url: await this.storage.presignDownload(image.key, USER_IMAGE_URL_TTL_SECONDS),
      expiresIn: USER_IMAGE_URL_TTL_SECONDS,
    };
  }
}
