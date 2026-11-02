import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CardFeesRepository } from '../../../src/modules/card-fees/card-fees.repository.js';
import type { DatabaseService } from '../../../src/shared/database/database.service.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

const brandId = '019a1234-5678-7000-8000-123456789001';
const providerId = '019a1234-5678-7000-8000-123456789002';
const rates = Array.from({ length: 18 }, (_, index) => ({
  installments: index + 1,
  ratePercent: '3.94',
}));
const input = {
  providerId,
  name: 'Visa',
  channel: 'Presencial',
  displayOrder: 10,
  logo: null,
  rates,
};

describe('Persistência de bandeiras (PostgreSQL simulado)', () => {
  const query =
    vi.fn<(statement: { text: string }, values?: unknown[]) => Promise<{ rows: unknown[][] }>>();
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const repository = new CardFeesRepository({ db } as DatabaseService);

  beforeEach(() => {
    query.mockReset().mockImplementation(async (statement) => ({
      rows:
        statement.text.startsWith('insert into "tax_brands"') ||
        statement.text.startsWith('update "tax_brands"')
          ? [
              [
                brandId,
                'org-test',
                providerId,
                'Visa',
                'Presencial',
                10,
                null,
                JSON.stringify(rates),
                '2026-01-01',
                '2026-01-01',
              ],
            ]
          : [],
    }));
  });

  it('grava a bandeira e as 18 taxas como JSON em uma única instrução da empresa', async () => {
    const saved = await repository.saveBrand('org-test', input, brandId);
    expect(query).toHaveBeenCalledTimes(1);
    const [statement, values] = query.mock.calls[0]!;
    expect(statement.text).toMatch(/^update "tax_brands" set .*"rates" = \$\d+/);
    expect(statement.text).toContain('"organization_id" =');
    expect(values).toContain('org-test');
    expect(values).toContain(brandId);
    expect(values).toContain(JSON.stringify(rates));
    expect(saved?.rates).toEqual(rates);

    query.mockClear();
    await repository.saveBrand('org-test', input);
    const [insert, insertValues] = query.mock.calls[0]!;
    expect(insert.text).toMatch(/^insert into "tax_brands"/);
    expect(insertValues).toContain('org-test');
    expect(insertValues).toContain(JSON.stringify(rates));
  });

  it('inclui empresa em toda consulta', async () => {
    await repository.findAll('org-test');
    await repository.listProviders('org-test');
    await repository.listBrands('org-test');
    await repository.findProvider('org-test', providerId);
    await repository.hasProviderBrands('org-test', providerId);
    await repository.saveProvider('org-test', { name: 'Provedor', logo: null }, providerId);
    await repository.removeProvider('org-test', providerId);
    await repository.removeBrand('org-test', brandId);
    for (const [statement, values] of query.mock.calls) {
      expect(statement.text).toContain('"organization_id" =');
      expect(values).toContain('org-test');
    }
  });
});

describe('Reordenação atômica (PostgreSQL simulado)', () => {
  const otherId = '019a1234-5678-7000-8000-123456789003';

  function setupOrder(failUpdate = false) {
    const query = vi.fn(async (statement: { text: string }) => {
      if (statement.text.startsWith('select') && statement.text.includes('from "tax_providers"'))
        return { rows: [[providerId]] };
      if (statement.text.startsWith('select') && statement.text.includes('from "tax_brands"'))
        return { rows: [[brandId], [otherId]] };
      if (failUpdate && statement.text.startsWith('update')) throw new Error('Falha simulada');
      return { rows: [] };
    });
    const db = drizzle({ client: { query } as unknown as Pool, schema });
    return { query, repository: new CardFeesRepository({ db } as DatabaseService) };
  }

  it('grava posições e restringe cada atualização à empresa e ao provedor', async () => {
    const { query, repository } = setupOrder();
    await expect(
      repository.reorderBrands('org-test', providerId, [otherId, brandId]),
    ).resolves.toBe('ok');
    const updates = query.mock.calls.filter(([statement]) => statement.text.startsWith('update'));
    expect(updates).toHaveLength(2);
    for (const [statement] of updates) {
      expect(statement.text).toContain('"organization_id" =');
      expect(statement.text).toContain('"provider_id" =');
    }
    expect(query.mock.calls.at(-1)?.[0].text).toBe('commit');
  });

  it('não atualiza listas incompletas ou bandeiras externas e reverte falhas', async () => {
    const { query, repository } = setupOrder();
    await expect(repository.reorderBrands('org-test', providerId, [brandId])).resolves.toBe(
      'stale',
    );
    expect(query.mock.calls.some(([statement]) => statement.text.startsWith('update'))).toBe(false);
    const failing = setupOrder(true);
    await expect(
      failing.repository.reorderBrands('org-test', providerId, [otherId, brandId]),
    ).rejects.toThrow();
    expect(failing.query.mock.calls.at(-1)?.[0].text).toBe('rollback');
  });
});
