import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserImagesRepository } from '../../../src/modules/user-images/user-images.repository.js';
import type { DatabaseService } from '../../../src/shared/database/database.service.js';
import * as schema from '../../../src/shared/database/schemas/index.js';

const id = '019a1234-5678-7000-8000-123456789abc';
const createdAt = new Date(Date.now() - 48 * 3600_000);
const row = [
  id,
  'user-test',
  null,
  `user-image/user-test/${id}`,
  'image/png',
  100,
  'ready',
  createdAt,
];

describe('UserImagesRepository: exclusão segura', () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const db = drizzle({ client: { query } as unknown as Pool, schema });
  const repository = new UserImagesRepository({ db } as DatabaseService);
  const remove = vi.fn();
  const rows = (...results: unknown[][][]) => {
    for (const result of results) query.mockResolvedValueOnce({ rows: result });
  };
  beforeEach(() => {
    query.mockReset().mockResolvedValue({ rows: [] });
    remove.mockReset().mockResolvedValue(undefined);
  });

  it('preserva qualquer imagem ainda referenciada por um usuário', async () => {
    rows([], [row], [['user-id']], []);
    await expect(repository.deleteUnreferenced('user-test', id, remove)).resolves.toBe(false);
    expect(remove).not.toHaveBeenCalled();
    expect(query.mock.calls.some(([sql]) => sql.text.startsWith('delete'))).toBe(false);
  });

  it('só remove o registro depois de excluir o objeto e filtra usuário e referência', async () => {
    rows([], [row], [], [], []);
    await expect(repository.deleteUnreferenced('user-test', id, remove)).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith(`user-image/user-test/${id}`);
    const [locked, values] = query.mock.calls[1]!;
    expect(locked.text).toContain('for update');
    expect(values).toEqual(expect.arrayContaining(['user-test', id]));
    const [reference, referenceValues] = query.mock.calls[2]!;
    expect(reference.text).toContain('"user"."image" like');
    expect(referenceValues).toContain(`%/user-images/${id}`);
    const [deletion, deletionValues] = query.mock.calls[4]!;
    expect(deletion.text).toContain('delete from "user_images"');
    expect(deletionValues).toEqual(expect.arrayContaining(['user-test', id]));
  });

  it('mantém o registro para uma nova tentativa se a exclusão no S3 falhar', async () => {
    rows([], [row], []);
    remove.mockRejectedValueOnce(new Error('Falha simulada'));
    await expect(repository.deleteUnreferenced('user-test', id, remove)).rejects.toThrow();
    expect(query.mock.calls.some(([sql]) => sql.text.startsWith('delete'))).toBe(false);
    expect(query.mock.calls.at(-1)?.[0].text).toBe('rollback');
  });

  it('não apaga uploads recentes na varredura de órfãos', async () => {
    rows([], [[...row.slice(0, -1), new Date()]], []);
    await expect(
      repository.deleteUnreferenced('user-test', id, remove, new Date(Date.now() - 24 * 3600_000)),
    ).resolves.toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });
  it.each(['findById', 'withImage', 'findCleanupCandidates'] as const)(
    '%s limita a consulta ao usuário autenticado',
    async (method) => {
      if (method === 'findById') await repository.findById('user-test', id);
      else if (method === 'withImage')
        await repository.withImage('user-test', id, async () => undefined);
      else await repository.findCleanupCandidates('user-test', new Date());
      const call = query.mock.calls.find(([statement]) => statement.text.startsWith('select'))!;
      expect(call[1]).toEqual(expect.arrayContaining(['user-test']));
      expect(call[0].text).toContain('"user_images"."user_id"');
      expect(call[0].text).not.toContain('organization_id');
    },
  );
});
