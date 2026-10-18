import { Inject, Injectable } from '@nestjs/common';
import { and, eq, like, lt, or } from 'drizzle-orm';
import { DatabaseService } from '../../../shared/database/database.service.js';
import { images, user } from '../../../shared/database/schemas/index.js';
import type { Image } from '../../../shared/database/schemas/index.js';

@Injectable()
export class UserImagesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async withImage<T>(
    organizationId: string,
    id: string,
    action: (image: Image | undefined) => Promise<T>,
  ) {
    return this.database.db.transaction(async (tx) => {
      const [image] = await tx
        .select()
        .from(images)
        .where(and(eq(images.organizationId, organizationId), eq(images.id, id)))
        .for('update');
      return action(image);
    });
  }

  // O job enumera empresas; cada consulta e exclusão de imagens usa o escopo correspondente.
  async listOrganizationsForCleanup(cutoff: Date) {
    return this.database.db
      .selectDistinct({ organizationId: images.organizationId })
      .from(images)
      .where(and(eq(images.keyPrefix, 'user-image'), lt(images.createdAt, cutoff)));
  }

  async findAbandoned(organizationId: string, cutoff: Date) {
    return this.database.db
      .select({ id: images.id })
      .from(images)
      .where(
        and(
          eq(images.organizationId, organizationId),
          eq(images.keyPrefix, 'user-image'),
          lt(images.createdAt, cutoff),
        ),
      )
      .orderBy(images.createdAt, images.id);
  }

  async deleteUnreferenced(
    organizationId: string,
    id: string,
    removeObject: (key: string) => Promise<void>,
    cutoff?: Date,
  ) {
    return this.database.db.transaction(async (tx) => {
      const [image] = await tx
        .select()
        .from(images)
        .where(
          and(
            eq(images.organizationId, organizationId),
            eq(images.id, id),
            eq(images.keyPrefix, 'user-image'),
          ),
        )
        .for('update');
      if (!image || (cutoff && image.createdAt >= cutoff)) return false;
      // Preserva fotos referenciadas por qualquer usuário, inclusive URLs com hosts antigos.
      const [reference] = await tx
        .select({ id: user.id })
        .from(user)
        .where(
          or(
            eq(user.image, image.key),
            like(user.image, `%/user-images/${image.id}`),
            like(user.image, `%/${image.key}`),
            like(user.image, `%/${image.key}?%`),
          ),
        )
        .limit(1);
      if (reference) return false;
      await removeObject(image.key);
      await tx
        .delete(images)
        .where(and(eq(images.organizationId, organizationId), eq(images.id, id)));
      return true;
    });
  }
}
