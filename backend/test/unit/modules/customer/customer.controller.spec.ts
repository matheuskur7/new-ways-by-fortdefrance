import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AuthGuard } from '../../../../src/modules/auth/auth.guard.js';
import { AuthService } from '../../../../src/modules/auth/auth.service.js';
import { CustomerModule } from '../../../../src/modules/customer/customer.module.js';
import { OrganizationRepository } from '../../../../src/modules/organization/organization.repository.js';
import { CustomerRepository } from '../../../../src/modules/customer/customer.repository.js';
import { configureApplication } from '../../../../src/shared/http/configure-application.js';

// Database and sessions are mocked; HTTP checks require a local port only.
describe('Customer HTTP validation and session authorship', () => {
  let app: NestExpressApplication;
  const id = '0199eac0-7000-7000-8000-000000000001';
  const repository = {
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };
  const organizationRepository = { hasMembership: vi.fn() };
  const dto = {
    name: 'Cliente',
    cpfCnpj: '12345678901',
    phone: '11999999999',
    type: 'PERSON',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CustomerModule],
      providers: [
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: AuthService,
          useValue: {
            getSession: vi.fn((headers: { cookie?: string }) =>
              headers.cookie === 'session=alice'
                ? {
                    user: { id: 'alice' },
                    session: { activeOrganizationId: 'company-a' },
                  }
                : null,
            ),
            assertTrustedOrigin: vi.fn((headers: { origin?: string }) => {
              if (headers.origin !== 'http://frontend.test')
                throw new ForbiddenException();
            }),
          },
        },
      ],
    })
      .overrideProvider(CustomerRepository)
      .useValue(repository)
      .overrideProvider(OrganizationRepository)
      .useValue(organizationRepository)
      .compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
  });
  afterAll(async () => app?.close());
  beforeEach(() => {
    vi.clearAllMocks();
    organizationRepository.hasMembership.mockResolvedValue(true);
    repository.create.mockResolvedValue({ id });
    repository.update.mockResolvedValue({ id });
    repository.findOne.mockResolvedValue({
      ...dto,
    });
  });

  it('rejects address fields on create and update because customers no longer store addresses', async () => {
    for (const field of [
      'address',
      'addressCountryCode',
      'postalCode',
      'street',
      'number',
      'complement',
      'neighborhood',
      'city',
      'state',
      'foreignState',
    ]) {
      await post({ ...dto, [field]: 'valor' }).expect(400);
      await patch({ name: 'Outro', [field]: 'valor' }).expect(400);
    }
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects removed foreign registration fields on create and update', async () => {
    for (const field of [
      'nif',
      'noNifReason',
      'countryCode',
      'idEstrangeiro',
    ]) {
      await post({ ...dto, [field]: 'valor' }).expect(400);
      await patch({ name: 'Outro', [field]: 'valor' }).expect(400);
    }
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('requires the original customer fields and rejects null values on partial updates', async () => {
    for (const field of ['name', 'cpfCnpj', 'phone', 'type']) {
      const missing = { ...dto } as Record<string, unknown>;
      delete missing[field];
      await post(missing).expect(400);
      await post({ ...dto, [field]: null }).expect(400);
      await patch({ [field]: null }).expect(400);
    }
    await patch({}).expect(400);
    for (const invalid of [
      { cpfCnpj: '' },
      { cpfCnpj: '1234567890' },
      { cpfCnpj: '123456789012345' },
      { cpfCnpj: 'AB12345678901' },
      { phone: 'abc' },
    ]) {
      await post({ ...dto, ...invalid }).expect(400);
    }
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('creates and updates customers using only the original data and session authorship', async () => {
    await post(dto).expect(201);
    expect(repository.create).toHaveBeenCalledWith(
      'company-a',
      expect.objectContaining(dto),
    );
    await patch({ name: 'Outro cliente' }).expect(200);
    expect(repository.update).toHaveBeenCalledWith(
      'company-a',
      id,
      expect.objectContaining({ name: 'Outro cliente' }),
    );
  });

  function post(body: object) {
    return request(app.getHttpServer())
      .post('/api/customers')
      .set('Cookie', 'session=alice')
      .set('Origin', 'http://frontend.test')
      .send(body);
  }
  function patch(body: object) {
    return request(app.getHttpServer())
      .patch(`/api/customers/${id}`)
      .set('Cookie', 'session=alice')
      .set('Origin', 'http://frontend.test')
      .send(body);
  }

  it('rejects anonymous or expired sessions before writing', async () => {
    await request(app.getHttpServer())
      .post('/api/customers')
      .send(dto)
      .expect(401);
    await request(app.getHttpServer())
      .patch(`/api/customers/${id}`)
      .set('Cookie', 'expired')
      .send({ name: 'Outro' })
      .expect(401);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects mutation requests from an untrusted origin', async () => {
    await request(app.getHttpServer())
      .post('/api/customers')
      .set('Cookie', 'session=alice')
      .set('Origin', 'http://attacker.test')
      .send(dto)
      .expect(403);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects forged audit, organization, owner and relation fields on create and update', async () => {
    for (const field of [
      'createdBy',
      'updatedBy',
      'organizationId',
      'userId',
      'user',
      'creator',
      'updater',
      'organization',
    ]) {
      await post({ ...dto, [field]: 'mallory' }).expect(400);
      await patch({ name: 'Outro', [field]: 'mallory' }).expect(400);
    }
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects stale membership on both create and update', async () => {
    organizationRepository.hasMembership.mockResolvedValue(false);
    await post(dto).expect(403);
    await patch({ name: 'Outro' }).expect(403);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
