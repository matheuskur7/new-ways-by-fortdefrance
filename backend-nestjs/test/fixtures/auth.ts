import type { AuthSession } from '../../src/modules/auth/auth.factory.js';

export const authSession: AuthSession = {
  user: {
    id: 'user-test',
    name: 'Test User',
    email: 'user@example.com',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  },
  session: {
    id: 'session-test',
    token: 'test-token',
    userId: 'user-test',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    ipAddress: null,
    userAgent: null,
    activeOrganizationId: 'org-test',
  },
};
