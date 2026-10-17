import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Environment } from '../config/env.js';
import * as schema from './schemas/index.js';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;
  readonly db: ReturnType<typeof drizzle<typeof schema>>;

  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    this.pool = new Pool({
      connectionString: config.get('DATABASE_URL', { infer: true }),
    });
    this.pool.on('error', (error) =>
      new Logger(DatabaseService.name).error(error),
    );
    this.db = drizzle(this.pool, { schema });
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
