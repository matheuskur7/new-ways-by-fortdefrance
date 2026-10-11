import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { Prisma } from '../../../../src/generated/prisma/client.js';
import { AuthGuard } from '../../../../src/modules/auth/auth.guard.js';
import { AuthService } from '../../../../src/modules/auth/auth.service.js';
import { CardFeesModule } from '../../../../src/modules/card-fees/card-fees.module.js';
import { CardFeesRepository } from '../../../../src/modules/card-fees/card-fees.repository.js';

// Database and authentication use mocks; HTTP tests need only a local port.
describe('CardFeesController', () => {
  let app: NestExpressApplication;
  const findAll = vi.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CardFeesModule],
      providers: [
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: AuthService,
          useValue: {
            getSession: vi.fn((headers: { cookie?: string }) =>
              headers.cookie === 'session=test'
                ? { user: { id: 'user' } }
                : null,
            ),
          },
        },
      ],
    })
      .overrideProvider(CardFeesRepository)
      .useValue({ findAll })
      .compile();
    app = module.createNestApplication<NestExpressApplication>();
    await app.init();
  });
  afterAll(async () => app?.close());
  beforeEach(() => findAll.mockReset());

  it('rejects anonymous access before querying fees', async () => {
    await request(app.getHttpServer()).get('/api/card-fees').expect(401);
    expect(findAll).not.toHaveBeenCalled();
  });
  it('returns decimal rates and disables HTTP cache for authenticated users', async () => {
    findAll.mockResolvedValue([
      {
        id: 'visa',
        name: 'Visa / Mastercard',
        channel: 'Presencial',
        logoSvg: null,
        rates: [{ installments: 2, ratePercent: new Prisma.Decimal('3.94') }],
      },
    ]);
    const response = await request(app.getHttpServer())
      .get('/api/card-fees')
      .set('Cookie', 'session=test')
      .expect(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.body[0].rates).toEqual([
      { installments: 2, ratePercent: '3.94' },
    ]);
  });
  it('returns an empty catalog without inventing fallback rates', async () => {
    findAll.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/api/card-fees')
      .set('Cookie', 'session=test')
      .expect(200)
      .expect([]);
  });
});
