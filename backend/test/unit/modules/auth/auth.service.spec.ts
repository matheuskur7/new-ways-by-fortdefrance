import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../../../src/modules/auth/auth.service.js';
import { getAuthOptions } from '../../../../src/modules/auth/auth.config.js';
import type { AuthSession } from '../../../../src/modules/auth/auth.config.js';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';

const config = new ConfigService({
  BETTER_AUTH_SECRET: 'test-secret-with-more-than-32-characters',
  BETTER_AUTH_URL: 'http://localhost:5000',
  FRONTEND_URL: 'http://localhost:3000',
});
const session = {
  user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
  session: { activeOrganizationId: 'org-1' },
} as AuthSession;

function setup() {
  const member = {
    findUnique: vi.fn().mockResolvedValue({
      role: 'owner',
      organization: { id: 'org-1', name: 'Org', slug: 'org' },
    }),
  };
  const service = new AuthService(
    { member } as unknown as PrismaService,
    config,
  );
  return { service, member };
}

describe('AuthService organization context', () => {
  it('checks the current user membership, rather than trusting the session organization ID', async () => {
    const { service, member } = setup();
    expect(await service.getContext(session)).toEqual({
      user: { ...session.user, image: null },
      organization: { id: 'org-1', name: 'Org', slug: 'org', role: 'owner' },
    });
    expect(member.findUnique).toHaveBeenCalledWith({
      where: {
        organizationId_userId: { organizationId: 'org-1', userId: 'user-1' },
      },
      include: { organization: true },
    });
  });
  it('includes the user photo in the authenticated context', async () => {
    const { service } = setup();
    const image = 'https://example.com/avatar.jpg';
    const context = await service.getContext({
      ...session,
      user: { ...session.user, image },
    });
    expect(context.user.image).toBe(image);
  });
  it('returns no organization when the membership has been revoked', async () => {
    const { service, member } = setup();
    member.findUnique.mockResolvedValue(null);
    expect((await service.getContext(session)).organization).toBeNull();
  });
  it('allows authenticated onboarding without an active organization', async () => {
    const { service, member } = setup();
    expect(
      (
        await service.getContext({
          ...session,
          session: { ...session.session, activeOrganizationId: null },
        })
      ).organization,
    ).toBeNull();
    expect(member.findUnique).not.toHaveBeenCalled();
  });
  it('accepts only configured origins for authenticated mutations', () => {
    const { service } = setup();
    expect(() =>
      service.assertTrustedOrigin({ origin: 'http://localhost:3000' }),
    ).not.toThrow();
    expect(() =>
      service.assertTrustedOrigin({ origin: 'https://untrusted.example' }),
    ).toThrow('Origem');
    expect(() => service.assertTrustedOrigin({})).toThrow('Origem');
  });

  it('rejects the example secret at startup', () => {
    expect(() =>
      getAuthOptions(
        new ConfigService({
          BETTER_AUTH_SECRET:
            'replace-with-a-random-secret-of-at-least-32-characters',
        }),
      ),
    ).toThrow('BETTER_AUTH_SECRET');
  });
});
