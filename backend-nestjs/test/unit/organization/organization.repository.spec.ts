import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationRepository } from '../../../src/modules/organization/organization.repository.js';
import type { DatabaseService } from '../../../src/shared/database/database.service.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

describe('OrganizationRepository', () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const repository = new OrganizationRepository({ db } as DatabaseService);
  beforeEach(() => query.mockReset().mockResolvedValue({ rows: [] }));

  it('busca empresas e papéis em uma consulta filtrada pelo usuário', async () => {
    query.mockResolvedValueOnce({ rows: [['org-a', 'Empresa A', 'empresa-a', 'admin,owner']] });
    await expect(repository.findAllForUser('user-allowed')).resolves.toEqual([
      { id: 'org-a', name: 'Empresa A', slug: 'empresa-a', role: 'admin,owner' },
    ]);
    expect(query).toHaveBeenCalledOnce();
    const [statement, parameters] = query.mock.calls[0];
    expect(statement.text).toContain('inner join "organization"');
    expect(statement.text).toContain('"member"."organization_id" = "organization"."id"');
    expect(statement.text).toContain('where "member"."user_id" = $1');
    expect(parameters).toEqual(['user-allowed']);
    expect(statement.text).toContain('order by "organization"."name" asc, "organization"."id" asc');
  });

  it('retorna lista vazia quando não há vínculos', async () => {
    await expect(repository.findAllForUser('user-without-organizations')).resolves.toEqual([]);
    expect(query).toHaveBeenCalledOnce();
  });
});
