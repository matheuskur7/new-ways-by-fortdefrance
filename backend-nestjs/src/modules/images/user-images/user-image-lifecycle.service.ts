import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { z } from 'zod';
import type { Environment } from '../../../shared/config/env.js';
import { StorageService } from '../../../shared/storage/storage.service.js';
import { AuthService } from '../../auth/auth.service.js';
import type { AuthSession } from '../../auth/auth.factory.js';
import { OrganizationAccessService } from '../../organization/organization-access.service.js';
import { UserImagesRepository } from './user-images.repository.js';

@Injectable()
export class UserImageLifecycleService {
  private readonly logger = new Logger(UserImageLifecycleService.name);
  private cleaning = false;

  constructor(
    @Inject(UserImagesRepository) private readonly repository: UserImagesRepository,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OrganizationAccessService) private readonly organizations: OrganizationAccessService,
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
  ) {}

  async attach(id: string, name: string, session: AuthSession, headers: IncomingHttpHeaders) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const previous = session.user.image;
    const imageUrl = new URL(`/user-images/${id}`, this.config.get('FRONTEND_URL', { infer: true }))
      .href;
    const result = await this.repository.withImage(organizationId, id, async (image) => {
      if (!image || image.keyPrefix !== 'user-image')
        throw new NotFoundException('Foto não encontrada.');
      if (image.status !== 'ready' || image.createdAt.getTime() < Date.now() - 3600_000)
        throw new BadRequestException('Confirme uma foto enviada na última hora antes de salvar.');
      // A atualização continua sendo executada pelo handler nativo do Better Auth.
      return this.auth.auth.api.updateUser({
        body: { name, image: imageUrl },
        headers: fromNodeHeaders(headers),
        returnHeaders: true,
      });
    });
    if (previous && previous !== imageUrl) await this.cleanupPrevious(organizationId, previous);
    await this.cleanupAbandonedUploads();
    return result;
  }

  async remove(name: string, session: AuthSession, headers: IncomingHttpHeaders) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const result = await this.auth.auth.api.updateUser({
      body: { name, image: null },
      headers: fromNodeHeaders(headers),
      returnHeaders: true,
    });
    if (session.user.image) await this.cleanupPrevious(organizationId, session.user.image);
    return result;
  }

  private async cleanupPrevious(organizationId: string, previous: string) {
    try {
      const oldPath = new URL(previous, this.config.get('FRONTEND_URL', { infer: true })).pathname;
      const match = /^\/user-images\/([^/]+)$/.exec(oldPath);
      const oldId = z.uuid().safeParse(match?.[1]);
      if (oldId.success)
        await this.repository.deleteUnreferenced(organizationId, oldId.data, (key) =>
          this.storage.delete(key),
        );
    } catch {
      this.logger.warn('A foto anterior será removida em uma próxima limpeza.');
    }
  }

  async cleanupAbandonedUploads() {
    if (this.cleaning) return;
    this.cleaning = true;
    try {
      const cutoff = new Date(Date.now() - 24 * 3600_000);
      for (const { organizationId } of await this.repository.listOrganizationsForCleanup(cutoff)) {
        for (const image of await this.repository.findAbandoned(organizationId, cutoff)) {
          try {
            await this.repository.deleteUnreferenced(
              organizationId,
              image.id,
              (key) => this.storage.delete(key),
              cutoff,
            );
          } catch {
            this.logger.warn('Uma foto sem vínculo será removida em uma próxima limpeza.');
          }
        }
      }
    } catch {
      this.logger.warn('Não foi possível concluir a limpeza de fotos; haverá uma nova tentativa.');
    } finally {
      this.cleaning = false;
    }
  }
}
