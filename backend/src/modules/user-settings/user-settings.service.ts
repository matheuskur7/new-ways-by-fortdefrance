import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageService } from '../../shared/storage/storage.service.js';
import { PrismaService } from '../../shared/db/prisma.service.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import { getAvatarPrefix } from '../../shared/storage/avatar-key.js';

@Injectable()
export class UserSettingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UserSettingsService.name);
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private cleaning = false;

  onModuleInit() {
    void this.cleanupAbandonedUploads();
    this.cleanupTimer = setInterval(() => {
      void this.cleanupAbandonedUploads();
    }, 3600_000);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async cleanupAbandonedUploads() {
    if (this.cleaning) return;
    this.cleaning = true;
    try {
      const cutoff = Date.now() - 24 * 3600_000;
      let token: string | undefined;
      do {
        const page = await this.storage.list('user-avatar/', token);
        for (const object of page.Contents ?? []) {
          if (
            !object.Key ||
            !object.LastModified ||
            object.LastModified.getTime() >= cutoff
          )
            continue;
          await this.deleteUnreferenced(object.Key);
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    } catch {
      this.logger.warn(
        'Falha na limpeza de avatares; a próxima execução tentará novamente.',
      );
    } finally {
      this.cleaning = false;
    }
  }

  private async deleteUnreferenced(key: string) {
    const referenced = await this.prisma.user.findFirst({
      where: { image: key },
      select: { id: true },
    });
    if (!referenced) await this.storage.delete(key);
  }

  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  private async cleanupPreviousImage(
    key: string | null | undefined,
    message: string,
  ) {
    if (!key?.startsWith('user-avatar/')) return;
    try {
      await this.deleteUnreferenced(key);
    } catch {
      this.logger.warn(message);
    }
  }

  async removeImage(userId: string) {
    const previous = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });
    await this.cleanupPreviousImage(
      previous?.image,
      'Foto removida será excluída pela rotina de limpeza.',
    );
    return { success: true };
  }

  async createUpload(userId: string) {
    const imageKey = `${getAvatarPrefix(userId)}${randomUUID()}.jpg`;
    return {
      imageKey,
      uploadUrl: await this.storage.getPresignedUploadUrl(
        imageKey,
        'image/jpeg',
        300,
      ),
    };
  }

  async update(userId: string, dto: UpdateProfileDto) {
    if (dto.imageKey) {
      if (!dto.imageKey.startsWith(getAvatarPrefix(userId))) {
        throw new BadRequestException('A imagem não pertence a este usuário.');
      }
      let object;
      try {
        object = await this.storage.inspect(dto.imageKey);
      } catch {
        throw new BadRequestException(
          'Envie a imagem antes de salvar o perfil.',
        );
      }
      if (
        !object.LastModified ||
        object.LastModified.getTime() < Date.now() - 3600_000 ||
        object.ContentType !== 'image/jpeg' ||
        !object.ContentLength ||
        object.ContentLength > 200 * 1024
      ) {
        throw new BadRequestException(
          'A imagem deve ser JPEG de até 200 KB, enviada na última hora.',
        );
      }
    }
    const previous = dto.imageKey
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { image: true },
        })
      : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        ...(dto.imageKey ? { image: dto.imageKey } : {}),
      },
    });
    if (previous?.image !== dto.imageKey) {
      await this.cleanupPreviousImage(
        previous?.image,
        'Foto substituída será removida pela rotina de limpeza.',
      );
    }
    return { success: true };
  }
}
