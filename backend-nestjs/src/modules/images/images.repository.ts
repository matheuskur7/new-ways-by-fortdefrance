import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database/database.service.js';
import { images } from '../../shared/database/schemas/index.js';

@Injectable()
export class ImagesRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async create(data: typeof images.$inferInsert) {
    const [image] = await this.database.db
      .insert(images)
      .values(data)
      .returning();
    return image;
  }

  async findById(id: string) {
    const [image] = await this.database.db
      .select()
      .from(images)
      .where(eq(images.id, id))
      .limit(1);
    return image;
  }

  async markReady(id: string) {
    const [image] = await this.database.db
      .update(images)
      .set({ status: 'ready' })
      .where(eq(images.id, id))
      .returning();
    return image;
  }
}
