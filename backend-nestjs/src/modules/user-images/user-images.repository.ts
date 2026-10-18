import { Inject, Injectable } from '@nestjs/common';
import { and, eq, like, lt, ne, or } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database/database.service.js';
import { userImages, user } from '../../shared/database/schemas/index.js';
import type { UserImage } from '../../shared/database/schemas/index.js';

@Injectable()
export class UserImagesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async create(userId: string) {
    const [image] = await this.database.db.insert(userImages).values({ userId }).returning();
    if (!image) throw new Error('Não foi possível criar a foto pendente.');
    return image;
  }

  async markReady(userId: string, id: string, metadata: { contentType: string; size: number }) {
    const [image] = await this.database.db
      .update(userImages)
      .set({ status: 'ready', ...metadata })
      .where(and(eq(userImages.userId, userId), eq(userImages.id, id)))
      .returning();
    return image;
  }

  async findById(userId: string, id: string) {
    const [image] = await this.database.db
      .select()
      .from(userImages)
      .where(and(eq(userImages.userId, userId), eq(userImages.id, id)))
      .limit(1);
    return image;
  }

  async withImage<T>(
    userId: string,
    id: string,
    action: (image: UserImage | undefined) => Promise<T>,
  ) {
    return this.database.db.transaction(async (tx) => {
      const [image] = await tx
        .select()
        .from(userImages)
        .where(and(eq(userImages.userId, userId), eq(userImages.id, id)))
        .for('update');
      return action(image);
    });
  }

  async findCleanupCandidates(userId: string, cutoff: Date) {
    return this.database.db
      .select({ id: userImages.id })
      .from(userImages)
      .where(and(eq(userImages.userId, userId), lt(userImages.createdAt, cutoff)))
      .orderBy(userImages.createdAt, userImages.id);
  }

  async deleteUnreferenced(
    userId: string,
    id: string,
    removeObject: (key: string) => Promise<void>,
    cutoff?: Date,
  ) {
    return this.database.db.transaction(async (tx) => {
      const [image] = await tx
        .select()
        .from(userImages)
        .where(and(eq(userImages.userId, userId), eq(userImages.id, id)))
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
      const [shared] = await tx
        .select({ id: userImages.id })
        .from(userImages)
        .where(and(eq(userImages.key, image.key), ne(userImages.id, image.id)))
        .limit(1);
      if (!shared) await removeObject(image.key);
      await tx.delete(userImages).where(and(eq(userImages.userId, userId), eq(userImages.id, id)));
      return true;
    });
  }
}
