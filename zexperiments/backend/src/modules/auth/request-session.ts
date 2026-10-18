import type { Request } from 'express';
import type { AuthSession } from './auth.config.js';
import type { AuthService } from './auth.service.js';

// Server-owned cache: request payloads cannot forge it, and entries expire with requests.
const sessions = new WeakMap<Request, Promise<AuthSession | null>>();

export function getRequestSession(
  request: Request,
  auth: Pick<AuthService, 'getSession'>,
) {
  let session = sessions.get(request);
  if (!session) {
    session = auth.getSession(request.headers);
    sessions.set(request, session);
  }
  return session;
}
