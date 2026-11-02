import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../../../src/shared/database/database.service.js';
import { seedCardFees } from '../../../src/shared/database/seeds/card-fees.seed.js';
import { initialTaxBrands } from '../../../src/shared/database/seeds/card-fees.data.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

describe('seedCardFees', () => {
  const query =
    vi.fn<(statement: { text: string }, values?: unknown[]) => Promise<{ rows: unknown[][] }>>();
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const database = { db } as DatabaseService;
  const statements = () => query.mock.calls.map(([statement]) => statement.text);

  beforeEach(() => {
    query.mockReset().mockImplementation(async (statement) => ({
      rows: statement.text.includes('from "tax_providers"') ? [['provider-id']] : [],
    }));
  });

  it('preserva as três bandeiras e as 36 taxas exatas do projeto de origem', () => {
    expect(initialTaxBrands.map(({ name, channel, rates }) => ({ name, channel, rates }))).toEqual([
      {
        name: 'Visa / Mastercard',
        channel: 'Presencial',
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
        name: 'Elo / American Express',
        channel: 'Presencial',
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
        name: 'Visa / Mastercard / Elo / American Express',
        channel: 'Link de pagamento',
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
    for (const group of initialTaxBrands) expect(group.logo).toMatch(/^<svg.*<\/svg>$/);
  });

  it('insere as três bandeiras com as 12 parcelas em JSON na mesma transação', async () => {
    await expect(seedCardFees(database, 'org-id')).resolves.toBe(3);
    const providerInsert = query.mock.calls.find(([sql]) =>
      sql.text.startsWith('insert into "tax_providers"'),
    );
    expect(providerInsert?.[1]).toEqual(['org-id', 'InfinitePay', null]);
    const brandInserts = query.mock.calls.filter(([sql]) =>
      sql.text.startsWith('insert into "tax_brands"'),
    );
    expect(brandInserts).toHaveLength(1);
    const [, values] = brandInserts[0]!;
    expect(statements().find((sql) => sql.includes('for update'))).toContain('"tax_providers"');
    expect(values?.filter((value) => value === 'org-id')).toHaveLength(3);
    expect(values?.filter((value) => value === 'provider-id')).toHaveLength(3);
    const rates = values
      ?.filter((value): value is string => typeof value === 'string' && value.startsWith('[{'))
      .map((value) => JSON.parse(value) as { installments: number; ratePercent: string }[]);
    expect(rates).toHaveLength(3);
    for (const [index, brand] of initialTaxBrands.entries()) {
      expect(rates?.[index]?.map((rate) => rate.installments)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
      expect(rates?.[index]?.map((rate) => rate.ratePercent)).toEqual(brand.rates);
    }
    expect(statements()[0]).toBe('begin');
    expect(statements().at(-1)).toBe('commit');
  });

  it('reconhece bandeiras existentes pelo nome sem sobrescrevê-las nem duplicá-las', async () => {
    query.mockImplementation(async (statement) => ({
      rows: statement.text.includes('from "tax_providers"')
        ? [['provider-id']]
        : statement.text.includes('from "tax_brands"')
          ? initialTaxBrands.map((brand) => [brand.name])
          : [],
    }));
    await expect(seedCardFees(database, 'org-id')).resolves.toBe(0);
    expect(statements().some((sql) => sql.startsWith('insert into "tax_brands"'))).toBe(false);
    expect(statements().some((sql) => sql.startsWith('update '))).toBe(false);
    const lookup = query.mock.calls.find(([sql]) => sql.text.includes('from "tax_brands"'));
    expect(lookup?.[1]).toEqual(['org-id', 'provider-id']);
  });

  it('insere somente as bandeiras iniciais ausentes, mesmo após renomear outra', async () => {
    query.mockImplementation(async (statement) => ({
      rows: statement.text.includes('from "tax_providers"')
        ? [['provider-id']]
        : statement.text.includes('from "tax_brands"')
          ? [[initialTaxBrands[0].name], ['Nome editado']]
          : [],
    }));
    await expect(seedCardFees(database, 'org-id')).resolves.toBe(2);
    const insert = query.mock.calls.find(([sql]) =>
      sql.text.startsWith('insert into "tax_brands"'),
    );
    expect(insert?.[1]).not.toContain(initialTaxBrands[0].name);
    expect(insert?.[1]).toContain(initialTaxBrands[1].name);
    expect(insert?.[1]).toContain(initialTaxBrands[2].name);
  });

  it('reverte o provedor se a inserção das bandeiras falhar', async () => {
    query.mockImplementation(async (statement) => {
      if (statement.text.startsWith('insert into "tax_brands"')) throw new Error('Falha simulada');
      return { rows: statement.text.includes('from "tax_providers"') ? [['provider-id']] : [] };
    });
    await expect(seedCardFees(database, 'org-id')).rejects.toThrow();
    expect(statements().at(-1)).toBe('rollback');
    expect(statements()).not.toContain('commit');
  });
  it('interrompe o seed se o provedor não puder ser consultado', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(seedCardFees(database, 'org-id')).rejects.toThrow(
      'Provedor inicial de taxas não encontrado.',
    );
    expect(statements().at(-1)).toBe('rollback');
    expect(statements().some((sql) => sql.startsWith('insert into "tax_brands"'))).toBe(false);
  });
});
