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
      await repository[operation](
        'org-allowed',
        '599b0722-4044-492b-97e2-24eac74a902a',
      );
      const [statement, values] = query.mock.calls[0];
      const filter = statement.text.match(
        /where \("images"\."id" = \$(\d+) and "images"\."organization_id" = \$(\d+)\)/,
      );
      expect(filter).not.toBeNull();
      expect(values[Number(filter![1]) - 1]).toBe(
        '599b0722-4044-492b-97e2-24eac74a902a',
      );
      expect(values[Number(filter![2]) - 1]).toBe('org-allowed');
    },
  );

  it('persiste a organização recebida pelo service em novas imagens', async () => {
    await repository.create('org-allowed', {
      id: '599b0722-4044-492b-97e2-24eac74a902a',
      key: 'images/org-allowed/test',
      filename: 'image.png',
      contentType: 'image/png',
      size: 100,
      checksum: Buffer.alloc(32).toString('base64'),
    });
    const [statement, values] = query.mock.calls[0];
    expect(statement.text).toContain('"organization_id"');
    expect(values).toContain('org-allowed');
  });
});
