import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InitialSeedService } from '../../../src/shared/database/seeds/initial-seed.service.js';
import type { DatabaseService } from '../../../src/shared/database/database.service.js';
import type { Environment } from '../../../src/shared/config/env.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

vi.mock('better-auth/crypto', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}));

describe('InitialSeedService', () => {
  const query =
    vi.fn<(statement: { text: string }, values?: unknown[]) => Promise<{ rows: unknown[][] }>>();
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const config = new ConfigService<Environment, true>({
    INITIAL_USER_NAME: 'Admin',
    INITIAL_USER_EMAIL: 'ADMIN@example.com',
    INITIAL_USER_PASSWORD: 'example-password',
    INITIAL_ORGANIZATION_NAME: 'Fort de France - Matriz',
    INITIAL_ORGANIZATION_SLUG: 'fortdefrance-matriz',
  });
  const service = new InitialSeedService(config, { db } as DatabaseService);
  const rows = (...results: unknown[][][]) => {
    for (const result of results) query.mockResolvedValueOnce({ rows: result });
  };
  const statements = () => query.mock.calls.map(([statement]) => statement.text);
  const writeValues = (table: string) =>
    query.mock.calls.find(([statement]) =>
      statement.text.startsWith(`insert into "${table}"`),
    )?.[1];

  beforeEach(() => {
    vi.clearAllMocks();
    query.mockReset().mockImplementation(async (statement) => {
      if (statement.text.includes('from "organization"')) return { rows: [['other-org']] };
      if (statement.text.includes('from "member"')) return { rows: [['other-member', 'member']] };
      return { rows: [] };
    });
  });

  it('cria usuário, credencial, matriz e proprietário na mesma transação', async () => {
    rows([], [['user-id']], [], [['org-id']], [['org-id']], [], [], []);
    await expect(service.run()).resolves.toBe(true);
    expect(writeValues('user')).toContain('admin@example.com');
    expect(writeValues('account')).toEqual(
      expect.arrayContaining(['user-id', 'credential', 'hashed-password']),
    );
    expect(writeValues('organization')).toEqual(
      expect.arrayContaining(['Fort de France - Matriz', 'fortdefrance-matriz']),
    );
    expect(writeValues('member')).toEqual(expect.arrayContaining(['org-id', 'user-id', 'owner']));
    expect(statements()[0]).toBe('begin');
    expect(statements().at(-1)).toBe('commit');
    expect(statements().filter((sql) => sql === 'begin')).toHaveLength(1);
    expect(
      statements().some((sql) => sql.includes('from "organization"') && sql.endsWith('for update')),
    ).toBe(true);
  });

  it('cria matriz e vínculo para usuário já existente sem alterar sua credencial', async () => {
    rows([], [], [['existing-user']], [['org-id']], [['org-id']], [], [], []);
    await expect(service.run()).resolves.toBe(true);
    expect(writeValues('account')).toBeUndefined();
    expect(writeValues('member')).toEqual(
      expect.arrayContaining(['org-id', 'existing-user', 'owner']),
    );
    expect(statements().some((sql) => sql.startsWith('update "user"'))).toBe(false);
  });

  it('usa nome e slug da empresa definidos no ambiente', async () => {
    const custom = new InitialSeedService(
      new ConfigService<Environment, true>({
        INITIAL_USER_NAME: 'Usuário Inicial',
        INITIAL_USER_EMAIL: 'initial@example.com',
        INITIAL_USER_PASSWORD: 'example-password',
        INITIAL_ORGANIZATION_NAME: 'Outra Unidade',
        INITIAL_ORGANIZATION_SLUG: 'outra-unidade',
      }),
      { db } as DatabaseService,
    );
    rows([], [['user-id']], [], [['org-id']], [['org-id']], [], [], []);
    await custom.run();
    expect(writeValues('organization')).toEqual(
      expect.arrayContaining(['Outra Unidade', 'outra-unidade']),
    );
    const lookup = query.mock.calls.find(([statement]) =>
      statement.text.includes('from "organization"'),
    );
    expect(lookup?.[1]).toContain('outra-unidade');
  });

  it('reutiliza a matriz existente e cria somente o vínculo faltante', async () => {
    rows([], [], [['user-id']], [], [['existing-org']], [], [], []);
    await expect(service.run()).resolves.toBe(true);
    expect(writeValues('member')).toContain('existing-org');
    const organizationInsert = statements().find((sql) =>
      sql.startsWith('insert into "organization"'),
    );
    expect(organizationInsert).toContain('on conflict ("slug") do nothing');
    expect(statements().some((sql) => sql.startsWith('update "organization"'))).toBe(false);
  });

  it('não duplica vínculo nem credencial ao reexecutar o seed completo', async () => {
    rows([], [], [['user-id']], [], [['org-id']], [['member-id', 'owner']], []);
    await expect(service.run()).resolves.toBe(false);
    expect(writeValues('account')).toBeUndefined();
    expect(writeValues('member')).toBeUndefined();
    expect(statements().some((sql) => sql.startsWith('update '))).toBe(false);
  });

  it('adiciona o papel de proprietário preservando outros papéis do vínculo', async () => {
    rows([], [], [['user-id']], [], [['org-id']], [['member-id', 'admin']], [], []);
    await expect(service.run()).resolves.toBe(true);
    const update = query.mock.calls.find(([statement]) =>
      statement.text.startsWith('update "member"'),
    );
    expect(update?.[1]).toEqual(['admin,owner', 'member-id', 'org-id', 'user-id']);
    expect(writeValues('member')).toBeUndefined();
  });

  it('preserva vínculos que já incluem proprietário junto a outros papéis', async () => {
    rows([], [], [['user-id']], [], [['org-id']], [['member-id', 'admin,owner']], []);
    await expect(service.run()).resolves.toBe(false);
    expect(statements().some((sql) => sql.startsWith('update '))).toBe(false);
  });

  it('reverte a transação se a criação do vínculo falhar', async () => {
    rows([], [['user-id']], [], [['org-id']], [['org-id']], []);
    query.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(service.run()).rejects.toMatchObject({ cause: { message: 'Falha simulada' } });
    expect(statements().at(-1)).toBe('rollback');
    expect(statements()).not.toContain('commit');
  });

  it('cria Outra Empresa com o usuário inicial como membro', async () => {
    rows(
      [],
      [['user-id']],
      [],
      [['org-id']],
      [['org-id']],
      [],
      [],
      [['other-org']],
      [['other-org']],
      [],
      [],
      [],
    );
    await expect(service.run()).resolves.toBe(true);
    const inserts = query.mock.calls.filter(([sql]) =>
      sql.text.startsWith('insert into "organization"'),
    );
    expect(inserts[1]?.[1]).toEqual(expect.arrayContaining(['Outra Empresa', 'outra-empresa']));
    const memberships = query.mock.calls.filter(([sql]) =>
      sql.text.startsWith('insert into "member"'),
    );
    expect(memberships[1]?.[1]).toEqual(expect.arrayContaining(['other-org', 'user-id', 'member']));
    expect(memberships[1]?.[1]).not.toContain('owner');
  });

  it('corrige o vínculo da outra empresa para membro mesmo se já for proprietário', async () => {
    rows(
      [],
      [],
      [['user-id']],
      [],
      [['org-id']],
      [['member-id', 'owner']],
      [],
      [['other-org']],
      [['other-member', 'admin,owner']],
      [],
      [],
    );
    await expect(service.run()).resolves.toBe(true);
    const update = query.mock.calls.find(([sql]) => sql.text.startsWith('update "member"'));
    expect(update?.[1]).toEqual(['member', 'other-member', 'other-org', 'user-id']);
  });

  it('rejeita configuração incompleta antes de acessar o banco', async () => {
    const invalid = new InitialSeedService(new ConfigService<Environment, true>({}), {
      db,
    } as DatabaseService);
    await expect(invalid.run()).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });

  it('exige os dados da empresa para executar o seed', async () => {
    const invalid = new InitialSeedService(
      new ConfigService<Environment, true>({
        INITIAL_USER_NAME: 'Usuário Inicial',
        INITIAL_USER_EMAIL: 'initial@example.com',
        INITIAL_USER_PASSWORD: 'example-password',
      }),
      { db } as DatabaseService,
    );
    await expect(invalid.run()).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });
});
