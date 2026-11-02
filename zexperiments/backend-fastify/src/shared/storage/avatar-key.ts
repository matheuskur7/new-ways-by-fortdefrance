import { createHash } from 'node:crypto';

export function getAvatarPrefix(userId: string): string {
  return `user-avatar/${createHash('sha256').update(userId).digest('hex')}-`;
}
