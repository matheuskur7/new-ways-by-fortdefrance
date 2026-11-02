import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CardFeesRepository } from '../../../src/modules/card-fees/card-fees.repository.js';
import type { DatabaseService } from '../../../src/shared/database/database.service.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

const groupId = '019a1234-5678-7000-8000-123456789001';
const providerId = '019a1234-5678-7000-8000-123456789002';
const input = {
  providerId,
  name: 'Visa',
  channel: 'Presencial',
  displayOrder: 10,
  logoSvg: null,
  rates: Array.from({ length: 18 }, (_, index) => ({
    installments: index + 1,
    ratePercent: '3.94',
  })),
};

describe('Persistência de taxas (PostgreSQL simulado)', () => {
  const query =
    vi.fn<(statement: { text: string }, values?: unknown[]) => Promise<{ rows: unknown[][] }>>();
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const repository = new CardFeesRepository({ db } as DatabaseService);

  beforeEach(() => {
    query.mockReset().mockImplementation(async (statement) => ({
      rows:
        statement.text.startsWith('insert into "card_fee_groups"') ||
        statement.text.startsWith('update "card_fee_groups"')
          ? [
              [
                groupId,
                'org-test',
                providerId,
                null,
                'Visa',
                'Presencial',
                10,
                null,
                '2026-01-01',
                '2026-01-01',
              ],
            ]
          : [],
    }));
  });

  it('grava grupo e 18 taxas em transação, restringindo a remoção ao grupo e empresa', async () => {
    await repository.saveGroup('org-test', input, groupId);
    const calls = query.mock.calls;
    expect(calls[0]?.[0].text).toBe('begin');
    expect(calls.at(-1)?.[0].text).toBe('commit');
    const update = calls.find(([statement]) =>
      statement.text.startsWith('update "card_fee_groups"'),
    );
    expect(update?.[0].text).toContain('"organization_id" =');
    expect(update?.[1]).toContain('org-test');
    expect(update?.[1]).toContain(groupId);
    const removal = calls.find(([statement]) =>
      statement.text.startsWith('delete from "card_fees"'),
    );
    expect(removal?.[0].text).toContain('"organization_id" =');
    expect(removal?.[1]?.slice(0, 2)).toEqual(['org-test', groupId]);
    const rates = calls.find(([statement]) => statement.text.startsWith('insert into "card_fees"'));
    expect(rates?.[0].text).toContain('on conflict ("group_id","installments") do update');
    expect(rates?.[1]).toHaveLength(18 * 4);
    expect(rates?.[1]?.slice(-4)).toEqual(['org-test', groupId, 18, '3.94']);
  });

  it('reverte o grupo e a remoção das taxas se uma taxa falhar', async () => {
    const original = query.getMockImplementation()!;
    query.mockImplementation(async (statement, values) => {
      if (statement.text.startsWith('insert into "card_fees"')) throw new Error('Falha simulada');
      return original(statement, values);
    });
    await expect(repository.saveGroup('org-test', input)).rejects.toThrow();
    expect(query.mock.calls.at(-1)?.[0].text).toBe('rollback');
    expect(query.mock.calls.some(([statement]) => statement.text === 'commit')).toBe(false);
  });

  it('inclui empresa em toda consulta e não altera taxas de um grupo ausente', async () => {
    await repository.findAll('org-test');
    await repository.listProviders('org-test');
    await repository.listGroups('org-test');
    await repository.findProvider('org-test', providerId);
    await repository.removeProvider('org-test', providerId);
    await repository.removeGroup('org-test', groupId);
    for (const [statement, values] of query.mock.calls) {
      expect(statement.text).toContain('"organization_id" =');
      expect(values).toContain('org-test');
    }
    query.mockClear();
    await expect(
      repository.saveRate('other-company', groupId, input.rates[0]!),
    ).resolves.toBeUndefined();
    expect(
      query.mock.calls.some(([statement]) => statement.text.startsWith('insert into "card_fees"')),
    ).toBe(false);
    expect(
      query.mock.calls.find(([statement]) => statement.text.includes('for update'))?.[1],
    ).toEqual(['other-company', groupId]);
  });
});

describe('Reordenação atômica (PostgreSQL simulado)', () => {
  const otherId = '019a1234-5678-7000-8000-123456789003';

  function setupOrder(failUpdate = false) {
    const query = vi.fn(async (statement: { text: string }) => {
      if (
        statement.text.startsWith('select') &&
        statement.text.includes('from "card_fee_providers"')
      )
        return { rows: [[providerId]] };
      if (statement.text.startsWith('select') && statement.text.includes('from "card_fee_groups"'))
        return { rows: [[groupId], [otherId]] };
      if (failUpdate && statement.text.startsWith('update')) throw new Error('Falha simulada');
      return { rows: [] };
    });
    const db = drizzle({ client: { query } as unknown as Pool, schema });
    return { query, repository: new CardFeesRepository({ db } as DatabaseService) };
  }

  it('grava posições e restringe cada atualização à empresa e ao provedor', async () => {
    const { query, repository } = setupOrder();
    await expect(
      repository.reorderGroups('org-test', providerId, [otherId, groupId]),
    ).resolves.toBe('ok');
    const updates = query.mock.calls.filter(([statement]) => statement.text.startsWith('update'));
    expect(updates).toHaveLength(2);
    for (const [statement] of updates) {
      expect(statement.text).toContain('"organization_id" =');
      expect(statement.text).toContain('"provider_id" =');
    }
    expect(query.mock.calls.at(-1)?.[0].text).toBe('commit');
  });

  it('não atualiza listas incompletas ou grupos externos e reverte falhas', async () => {
    const { query, repository } = setupOrder();
    await expect(repository.reorderGroups('org-test', providerId, [groupId])).resolves.toBe(
      'stale',
    );
    expect(query.mock.calls.some(([statement]) => statement.text.startsWith('update'))).toBe(false);
    const failing = setupOrder(true);
    await expect(
      failing.repository.reorderGroups('org-test', providerId, [otherId, groupId]),
    ).rejects.toThrow();
    expect(failing.query.mock.calls.at(-1)?.[0].text).toBe('rollback');
  });
});
