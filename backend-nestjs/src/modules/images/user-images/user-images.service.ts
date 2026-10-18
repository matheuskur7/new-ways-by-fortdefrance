import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { z } from 'zod';
import type { Environment } from '../../../shared/config/env.js';
import type { Image } from '../../../shared/database/schemas/index.js';
import { StorageService } from '../../../shared/storage/storage.service.js';
import { AuthService } from '../../auth/auth.service.js';
import type { AuthSession } from '../../auth/auth.factory.js';
import { OrganizationAccessService } from '../../organization/organization-access.service.js';
import { UserImagesRepository } from './user-images.repository.js';

export const USER_IMAGE_URL_TTL_SECONDS = 12 * 60 * 60;
const UPLOAD_MAX_AGE_MS = 60 * 60 * 1000;
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UserImagesService {
  private readonly logger = new Logger(UserImagesService.name);

  constructor(
    @Inject(UserImagesRepository) private readonly repository: UserImagesRepository,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OrganizationAccessService) private readonly organizations: OrganizationAccessService,
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
  ) {}

  async createDownload(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const image = await this.repository.findById(organizationId, id);
    this.requireReadyImage(image);
    return {
      url: await this.storage.presignDownload(image.key, USER_IMAGE_URL_TTL_SECONDS),
      expiresIn: USER_IMAGE_URL_TTL_SECONDS,
    };
  }

  async attach(id: string, name: string, session: AuthSession, headers: IncomingHttpHeaders) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const imageUrl = new URL(`/user-images/${id}`, this.config.get('FRONTEND_URL', { infer: true }))
      .href;
    const result = await this.repository.withImage(organizationId, id, async (image) => {
      this.requireReadyImage(image);
      if (image.createdAt.getTime() < Date.now() - UPLOAD_MAX_AGE_MS)
        throw new BadRequestException('Confirme uma foto enviada na última hora antes de salvar.');
      return this.updateProfile(name, imageUrl, headers);
    });

    if (session.user.image !== imageUrl)
      await this.cleanupPrevious(organizationId, session.user.image);
    await this.cleanupOrphans(organizationId);
    return result;
  }

  async remove(name: string, session: AuthSession, headers: IncomingHttpHeaders) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const result = await this.updateProfile(name, null, headers);
    await this.cleanupPrevious(organizationId, session.user.image);
    return result;
  }

  private requireReadyImage(image: Image | undefined): asserts image is Image {
    if (!image || image.keyPrefix !== 'user-image')
      throw new NotFoundException('Foto de usuário não encontrada.');
    if (image.status !== 'ready')
      throw new BadRequestException('O upload da foto ainda não foi confirmado.');
  }

  private updateProfile(name: string, image: string | null, headers: IncomingHttpHeaders) {
    return this.auth.auth.api.updateUser({
      body: { name, image },
      headers: fromNodeHeaders(headers),
      returnHeaders: true,
    });
  }

  private async cleanupPrevious(organizationId: string, previous: string | null | undefined) {
    // Reconhece a referência estável, inclusive se o host da aplicação tiver mudado.
    const match = previous?.match(/\/user-images\/([^/?#]+)(?:[?#].*)?$/);
    const id = z.uuid().safeParse(match?.[1]);
    if (id.success) await this.deleteUnreferenced(organizationId, id.data);
  }

  private async cleanupOrphans(organizationId: string) {
    try {
      const cutoff = new Date(Date.now() - ORPHAN_MIN_AGE_MS);
      const candidates = await this.repository.findCleanupCandidates(organizationId, cutoff);
      for (const image of candidates)
        await this.deleteUnreferenced(organizationId, image.id, cutoff);
    } catch {
      this.logger.warn('A limpeza de fotos da empresa será tentada no próximo envio.');
    }
  }

  private async deleteUnreferenced(organizationId: string, id: string, cutoff?: Date) {
    try {
      await this.repository.deleteUnreferenced(
        organizationId,
        id,
        (key) => this.storage.delete(key),
        cutoff,
      );
    } catch {
      // A falha na limpeza não desfaz o perfil salvo; o registro fica disponível para nova tentativa.
      this.logger.warn('Uma foto sem vínculo será verificada no próximo envio.');
    }
  }
}
