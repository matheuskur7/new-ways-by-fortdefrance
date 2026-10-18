import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../../../src/shared/database/database.service.js';
import { seedCardFees } from '../../../src/shared/database/seeds/card-fees.seed.js';
import { initialCardFeeGroups } from '../../../src/shared/database/seeds/card-fees.data.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

describe('seedCardFees', () => {
  const query =
    vi.fn<(statement: { text: string }, values?: unknown[]) => Promise<{ rows: unknown[][] }>>();
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const database = { db } as DatabaseService;
  const statements = () => query.mock.calls.map(([statement]) => statement.text);

  beforeEach(() => {
    query
      .mockReset()
      .mockImplementation(async (statement, values) => ({
        rows: statement.text.startsWith('insert into "card_fee_groups"') ? [[values?.[0]]] : [],
      }));
  });

  it('preserva os três grupos e as 36 taxas exatas do projeto de origem', () => {
    expect(initialCardFeeGroups.map(({ seedKey, rates }) => ({ seedKey, rates }))).toEqual([
      {
        seedKey: 'VISA_MASTERCARD',
        rates: [
          '0.00',
          '3.94',
          '4.46',
          '4.98',
          '5.49',
          '5.99',
          '6.51',
          '6.99',
          '7.51',
          '7.99',
          '8.49',
          '8.99',
        ],
      },
      {
        seedKey: 'ELO_AMEX',
        rates: [
          '0.00',
          '5.81',
          '6.32',
          '6.83',
          '7.33',
          '7.83',
          '8.34',
          '8.83',
          '9.32',
          '9.81',
          '10.29',
          '10.77',
        ],
      },
      {
        seedKey: 'PAYMENT_LINK',
        rates: [
          '0.00',
          '6.09',
          '7.01',
          '7.91',
          '8.80',
          '9.67',
          '12.59',
          '13.42',
          '14.25',
          '15.06',
          '15.87',
          '16.66',
        ],
      },
    ]);
    for (const group of initialCardFeeGroups) expect(group.logoSvg).toMatch(/^<svg.*<\/svg>$/);
  });

  it('insere grupos e suas 12 parcelas na mesma transação', async () => {
    await expect(seedCardFees(database)).resolves.toBe(3);
    const inserts = query.mock.calls.filter(([statement]) =>
      statement.text.startsWith('insert into "card_fees"'),
    );
    expect(inserts).toHaveLength(3);
    for (const [, values] of inserts) {
      expect(values).toHaveLength(36);
      expect(values?.filter((_, index) => index % 3 === 1)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
    }
    expect(statements()[0]).toBe('begin');
    expect(statements().at(-1)).toBe('commit');
  });

  it('não sobrescreve nem duplica grupos e taxas em reexecuções', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(seedCardFees(database)).resolves.toBe(0);
    expect(
      statements().filter((sql) => sql.startsWith('insert into "card_fee_groups"')),
    ).toHaveLength(3);
    expect(
      statements().filter((sql) => sql.includes('on conflict ("seed_key") do nothing')),
    ).toHaveLength(3);
    expect(
      statements().some(
        (sql) => sql.startsWith('insert into "card_fees"') || sql.startsWith('update '),
      ),
    ).toBe(false);
  });

  it('reverte a criação dos grupos se a inserção das taxas falhar', async () => {
    query.mockImplementation(async (statement) => {
      if (statement.text.startsWith('insert into "card_fees"')) throw new Error('Falha simulada');
      return {
        rows: statement.text.startsWith('insert into "card_fee_groups"') ? [['group-id']] : [],
      };
    });
    await expect(seedCardFees(database)).rejects.toThrow();
    expect(statements().at(-1)).toBe('rollback');
    expect(statements()).not.toContain('commit');
  });
});
