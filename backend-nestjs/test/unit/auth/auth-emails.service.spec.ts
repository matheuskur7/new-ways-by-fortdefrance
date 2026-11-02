import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthEmailsService,
  safeRedirectPath,
} from '../../../src/modules/auth/auth-emails.service.js';
import {
  formatDateTime,
  formatRoles,
} from '../../../src/modules/auth/emails/auth-email.templates.js';
import type { Environment } from '../../../src/shared/config/env.js';
import type { EmailService } from '../../../src/shared/email/email.service.js';
import type { SendEmailDto } from '../../../src/shared/email/dto/send-email.dto.js';

describe('AuthEmailsService', () => {
  const send = vi.fn<(input: SendEmailDto) => Promise<{ id: string }>>();
  const config = new ConfigService<Environment, true>({
    FRONTEND_URL: 'https://app.example.com',
  });
  let service: AuthEmailsService;
  const user = { name: 'Ana Souza', email: 'ana@example.com' };
  const sent = () => send.mock.calls[0]![0];
  const link = (html: string | undefined) =>
    new URL(html!.match(/href="([^"]+)"/)![1]!.replaceAll('&amp;', '&'));

  beforeEach(() => {
    send.mockReset().mockResolvedValue({ id: 'message-id' });
    service = new AuthEmailsService({ send } as unknown as EmailService, config);
  });

  it('envia a redefinição de senha com link para a página do frontend', async () => {
    await service.sendPasswordReset({ user, token: 'reset-token' });
    const email = sent();
    expect(email).toMatchObject({
      to: 'ana@example.com',
      subject: 'Redefinição de senha · New Ways',
    });
    const url = link(email.html);
    expect(url.origin + url.pathname).toBe('https://app.example.com/redefinir-senha');
    expect(url.searchParams.get('token')).toBe('reset-token');
    expect(email.html).toContain('Olá, Ana!');
    expect(email.text).toContain('1 hora');
    expect(email.text).toContain('https://app.example.com/redefinir-senha?token=reset-token');
  });

  it('envia a verificação com o token e o destino interno da página de confirmação', async () => {
    await service.sendEmailVerification({
      user,
      url: 'http://backend:5000/api/auth/verify-email?token=jwt-token&callbackURL=%2Fconvite%2Fabc',
    });
    const url = link(sent().html);
    expect(url.origin + url.pathname).toBe('https://app.example.com/verificar-email');
    expect(url.searchParams.get('token')).toBe('jwt-token');
    expect(url.searchParams.get('next')).toBe('/convite/abc');
    expect(sent().subject).toBe('Confirme seu e-mail · New Ways');
    expect(sent().text).toContain('ana@example.com');
    expect(sent().text).toContain('24 horas');
  });

  it('ignora reenvios de confirmação para o mesmo e-mail dentro do intervalo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const url = 'http://backend/api/auth/verify-email?token=jwt-token';
      await service.sendEmailVerification({ user, url });
      await service.sendEmailVerification({ user: { ...user, email: 'ANA@example.com' }, url });
      await service.sendEmailVerification({ user: { ...user, email: 'outra@example.com' }, url });
      expect(send).toHaveBeenCalledTimes(2);
      vi.setSystemTime(Date.now() + 60_000);
      await service.sendEmailVerification({ user, url });
      expect(send).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('não envia verificação sem token', async () => {
    await expect(
      service.sendEmailVerification({ user, url: 'http://backend/api/auth/verify-email' }),
    ).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });

  it('envia o convite com empresa, cargo, quem convidou e validade escapados', async () => {
    await service.sendInvitation({
      id: 'invitation id',
      email: 'novo@example.com',
      role: 'admin',
      expiresAt: new Date('2026-11-04T15:30:00.000Z'),
      organizationName: 'Oficina <Centro>',
      inviter: user,
    });
    const email = sent();
    expect(email.to).toBe('novo@example.com');
    expect(email.subject).toBe('Convite para Oficina <Centro> · New Ways');
    expect(link(email.html).toString()).toBe('https://app.example.com/convite/invitation%20id');
    expect(email.html).toContain('Oficina &lt;Centro&gt;');
    expect(email.html).not.toContain('Oficina <Centro>');
    for (const text of ['Administrador', 'Ana Souza (ana@example.com)', '04/11/2026 às 12:30']) {
      expect(email.text).toContain(text);
    }
  });

  it('avisa o membro sobre a alteração de cargo com os cargos traduzidos', async () => {
    await service.sendMemberRoleChanged({
      user,
      organizationName: 'Oficina Centro',
      previousRole: 'member',
      role: 'admin',
    });
    const email = sent();
    expect(email).toMatchObject({
      to: 'ana@example.com',
      subject: 'Seu cargo em Oficina Centro foi alterado · New Ways',
    });
    expect(link(email.html).toString()).toBe('https://app.example.com/empresas');
    for (const text of ['Olá, Ana!', 'Cargo anterior: Membro', 'Novo cargo: Administrador']) {
      expect(email.text).toContain(text);
    }
  });

  it('propaga falhas do envio para o chamador decidir como tratar', async () => {
    send.mockRejectedValue(new Error('smtp'));
    await expect(service.sendPasswordReset({ user, token: 'token' })).rejects.toThrow('smtp');
  });

  it.each([
    [undefined, '/empresas'],
    ['/', '/empresas'],
    ['/convite/abc?x=1', '/convite/abc?x=1'],
    ['https://app.example.com/taxas', '/taxas'],
    ['https://evil.example.com/taxas', '/empresas'],
    ['//evil.example.com', '/empresas'],
    ['/\\evil.example.com', '/empresas'],
  ])('limita o destino após a verificação a caminhos internos: %s', (value, expected) => {
    expect(safeRedirectPath(value, 'https://app.example.com')).toBe(expected);
  });

  it('traduz cargos e formata datas no horário de Brasília', () => {
    expect(formatRoles('admin, member')).toBe('Administrador, Membro');
    expect(formatRoles('owner')).toBe('Proprietário');
    expect(formatDateTime(new Date('2026-01-02T03:04:00.000Z'))).toBe('02/01/2026 às 00:04');
  });
});
