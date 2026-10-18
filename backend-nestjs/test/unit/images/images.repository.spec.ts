import type { ImageKey } from '../../../src/shared/storage/image-keys.js';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImagesRepository } from '../../../src/modules/images/images.repository.js';
import { DatabaseService } from '../../../src/shared/database/database.service.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

describe('ImagesRepository: isolamento no SQL', () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const repository = new ImagesRepository({ db } as DatabaseService);

  beforeEach(() => query.mockClear());

  it.each(['findById', 'markReady'] as const)(
    '%s inclui id e organização no filtro de persistência',
    async (operation) => {
      const id = '599b0722-4044-492b-97e2-24eac74a902a';
      if (operation === 'findById') await repository.findById('org-allowed', id);
      else
        await repository.markReady('org-allowed', id, {
          contentType: 'image/png',
          size: 100,
        });
      const [statement, values] = query.mock.calls[0];
      const filter = statement.text.match(
        /where \("images"\."id" = \$(\d+) and "images"\."organization_id" = \$(\d+)\)/,
      );
      expect(filter).not.toBeNull();
      expect(values[Number(filter![1]) - 1]).toBe('599b0722-4044-492b-97e2-24eac74a902a');
      expect(values[Number(filter![2]) - 1]).toBe('org-allowed');
    },
  );

  it('insere apenas organização e prefixo; UUIDv7 e chave completa são gerados pelo banco', async () => {
    query.mockResolvedValueOnce({
      rows: [
        [
          '019a1234-5678-7000-8000-123456789abc',
          'org-allowed',
          'test-image',
          'images/org-allowed/test-image/019a1234-5678-7000-8000-123456789abc',
          null,
          null,
          'pending',
          new Date(),
        ],
      ],
    });
    await repository.create('org-allowed', 'test-image' as ImageKey);
    const [statement, values] = query.mock.calls[0];
    expect(statement.text).toContain('insert into "images"');
    expect(values).toEqual(['org-allowed', 'test-image']);
    expect(new PgDialect().sqlToQuery(schema.images.id.default as SQL).sql).toBe('uuidv7()');
    expect(schema.images.organizationId.notNull).toBe(true);
    expect(schema.images.keyPrefix.notNull).toBe(true);
    expect(schema.images.key.notNull).toBe(true);
    expect(schema.images.key.generated).toBeDefined();
  });
});
