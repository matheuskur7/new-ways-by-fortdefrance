import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database/database.service.js';
import { images } from '../../shared/database/schemas/index.js';

@Injectable()
export class ImagesRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async create(
    organizationId: string,
    data: Omit<typeof images.$inferInsert, 'organizationId'>,
  ) {
    const [image] = await this.database.db
      .insert(images)
      .values({ ...data, organizationId })
      .returning();
    return image;
  }

  async findById(organizationId: string, id: string) {
    const [image] = await this.database.db
      .select()
      .from(images)
      .where(and(eq(images.id, id), eq(images.organizationId, organizationId)))
      .limit(1);
    return image;
  }

  async markReady(organizationId: string, id: string) {
    const [image] = await this.database.db
      .update(images)
      .set({ status: 'ready' })
      .where(and(eq(images.id, id), eq(images.organizationId, organizationId)))
      .returning();
    return image;
  }
}
