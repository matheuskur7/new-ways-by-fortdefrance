import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<{ actorId: string | null }>();

export function runWithAuditActor<T>(
  actorId: string | null,
  operation: () => T | PromiseLike<T>,
): Promise<T> {
  // Resolve lazy Prisma promises while still inside the actor's async scope.
  return storage.run({ actorId }, async () => await operation());
}

export function getAuditActor(): string | null {
  return storage.getStore()?.actorId ?? null;
}
