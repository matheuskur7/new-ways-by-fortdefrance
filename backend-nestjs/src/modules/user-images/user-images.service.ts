import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { z } from 'zod';
import type { Environment } from '../../shared/config/env.js';
import type { UserImage } from '../../shared/database/schemas/index.js';
import { StorageService } from '../../shared/storage/storage.service.js';
import { AuthService } from '../auth/auth.service.js';
import type { AuthSession } from '../auth/auth.factory.js';
import { inspectUploadedImage } from '../../shared/storage/inspect-uploaded-image.js';
import { imageResponseSchema } from './dto/user-images.dto.js';
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
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
  ) {}

  async createUpload(session: AuthSession) {
    const image = await this.repository.create(session.user.id);
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
    const image = await this.repository.findById(session.user.id, id);
    if (!image) throw new NotFoundException('Foto de usuário não encontrada.');
    if (image.status === 'ready') return imageResponseSchema.parse(image);
    const metadata = await inspectUploadedImage(this.storage, this.config, image.key);
    const ready = await this.repository.markReady(session.user.id, id, metadata);
    if (!ready) throw new NotFoundException('Foto de usuário não encontrada.');
    return imageResponseSchema.parse(ready);
  }

  async createDownload(id: string, session: AuthSession) {
    const image = await this.repository.findById(session.user.id, id);
    this.requireReadyImage(image);
    return {
      url: await this.storage.presignDownload(image.key, USER_IMAGE_URL_TTL_SECONDS),
      expiresIn: USER_IMAGE_URL_TTL_SECONDS,
    };
  }

  async attach(id: string, name: string, session: AuthSession, headers: IncomingHttpHeaders) {
    const userId = session.user.id;
    const imageUrl = new URL(`/user-images/${id}`, this.config.get('FRONTEND_URL', { infer: true }))
      .href;
    const result = await this.repository.withImage(userId, id, async (image) => {
      this.requireReadyImage(image);
      if (image.createdAt.getTime() < Date.now() - UPLOAD_MAX_AGE_MS)
        throw new BadRequestException('Confirme uma foto enviada na última hora antes de salvar.');
      return this.updateProfile(name, imageUrl, headers);
    });

    if (session.user.image !== imageUrl) await this.cleanupPrevious(userId, session.user.image);
    await this.cleanupOrphans(userId);
    return result;
  }

  async remove(name: string, session: AuthSession, headers: IncomingHttpHeaders) {
    const userId = session.user.id;
    const result = await this.updateProfile(name, null, headers);
    await this.cleanupPrevious(userId, session.user.image);
    return result;
  }

  private requireReadyImage(image: UserImage | undefined): asserts image is UserImage {
    if (!image) throw new NotFoundException('Foto de usuário não encontrada.');
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

  private async cleanupPrevious(userId: string, previous: string | null | undefined) {
    // Reconhece a referência estável, inclusive se o host da aplicação tiver mudado.
    const match = previous?.match(/\/user-images\/([^/?#]+)(?:[?#].*)?$/);
    const id = z.uuid().safeParse(match?.[1]);
    if (id.success) await this.deleteUnreferenced(userId, id.data);
  }

  private async cleanupOrphans(userId: string) {
    try {
      const cutoff = new Date(Date.now() - ORPHAN_MIN_AGE_MS);
      const candidates = await this.repository.findCleanupCandidates(userId, cutoff);
      for (const image of candidates) await this.deleteUnreferenced(userId, image.id, cutoff);
    } catch {
      this.logger.warn('A limpeza de fotos do usuário será tentada no próximo envio.');
    }
  }

  private async deleteUnreferenced(userId: string, id: string, cutoff?: Date) {
    try {
      await this.repository.deleteUnreferenced(
        userId,
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
