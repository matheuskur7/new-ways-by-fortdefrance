import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Environment } from '../../../src/shared/config/env.js';
import type { SendEmailDto } from '../../../src/shared/email/dto/send-email.dto.js';
import { EmailService } from '../../../src/shared/email/email.service.js';
import { smtpProvider } from '../../../src/shared/email/smtp.provider.js';
import type { EmailTransport } from '../../../src/shared/email/smtp.provider.js';

describe('EmailService via SMTP', () => {
  const sendMail = vi.fn();
  const close = vi.fn();
  const client = { sendMail, close } as unknown as EmailTransport;
  const config = new ConfigService<Environment, true>({
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: 465,
    SMTP_SECURE: true,
    SMTP_USER: 'sender@example.com',
    SMTP_PASSWORD: 'test-password',
    SMTP_FROM: 'New Ways <sender@example.com>',
    SMTP_REPLY_TO: 'support@example.com',
  });
  const service = new EmailService(client, config);
  const input = { to: 'recipient@example.com', subject: 'Assunto', text: 'Mensagem' };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    sendMail.mockResolvedValue({
      messageId: '<test-id@example.com>',
      accepted: [input.to],
      rejected: [],
    });
  });

  it('envia texto com remetente e replyTo do SMTP configurado', async () => {
    expect(await service.send(input)).toEqual({ id: '<test-id@example.com>' });
    expect(sendMail).toHaveBeenCalledWith({
      ...input,
      from: 'New Ways <sender@example.com>',
      replyTo: 'support@example.com',
    });
  });

  it('envia HTML, texto e destinatários adicionais', async () => {
    await service.send({
      to: ['recipient@example.com', 'other@example.com'],
      cc: 'copy@example.com',
      bcc: ['hidden@example.com'],
      subject: 'Assunto',
      html: '<p>Mensagem</p>',
      text: 'Mensagem',
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<p>Mensagem</p>',
        text: 'Mensagem',
        cc: 'copy@example.com',
        bcc: ['hidden@example.com'],
      }),
    );
  });

  it('aceita HTML sem texto e replyTo específico da mensagem', async () => {
    await service.send({
      to: input.to,
      subject: input.subject,
      html: '<p>Mensagem</p>',
      replyTo: 'other-reply@example.com',
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<p>Mensagem</p>',
        replyTo: 'other-reply@example.com',
      }),
    );
  });

  it('permite envio sem replyTo quando não configurado', async () => {
    const withoutReplyTo = new EmailService(
      client,
      new ConfigService<Environment, true>({
        SMTP_FROM: 'sender@example.com',
      }),
    );
    await withoutReplyTo.send(input);
    expect(sendMail.mock.calls[0][0].replyTo).toBeUndefined();
  });

  it.each([
    { ...input, to: 'invalid' },
    { ...input, to: [] },
    { ...input, subject: '' },
    { ...input, subject: 'Assunto\r\nBcc: other@example.com' },
    { to: input.to, subject: input.subject },
    { ...input, from: 'spoof@example.com' },
    { ...input, idempotencyKey: 'not-supported-by-smtp' },
    { ...input, to: Array.from({ length: 50 }, () => input.to), cc: 'extra@example.com' },
  ])('rejeita dados inválidos antes de chamar o transporte: %o', async (invalid) => {
    await expect(service.send(invalid as SendEmailDto)).rejects.toThrow(BadRequestException);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('não envia quando faltam transporte ou remetente', async () => {
    await expect(new EmailService(null, config).send(input)).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(
      new EmailService(client, new ConfigService<Environment, true>()).send(input),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('trata erros SMTP sem expor detalhes sensíveis', async () => {
    sendMail.mockRejectedValue(new Error('private-smtp-password'));
    await expect(service.send(input)).rejects.toThrow(BadGatewayException);
    await expect(service.send(input)).rejects.not.toThrow('private-smtp-password');
  });

  it.each([
    { messageId: 'test', accepted: [], rejected: [input.to] },
    { messageId: 'test', accepted: [input.to], rejected: ['other@example.com'] },
    { accepted: [input.to], rejected: [] },
  ])('rejeita falha total, parcial ou resposta sem identificador: %o', async (result) => {
    sendMail.mockResolvedValue(result);
    await expect(service.send(input)).rejects.toThrow(BadGatewayException);
  });

  it('encerra o transporte com a aplicação', () => {
    service.onApplicationShutdown();
    expect(close).toHaveBeenCalledOnce();
    new EmailService(null, config).onApplicationShutdown();
  });

  it('usa TLS direto na porta 465 sem abrir conexão durante a criação', () => {
    const create = vi
      .spyOn(nodemailer, 'createTransport')
      .mockReturnValue(client as ReturnType<typeof nodemailer.createTransport>);
    expect(smtpProvider.useFactory(config)).toBe(client);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        requireTLS: false,
        auth: { user: 'sender@example.com', pass: 'test-password' },
      }),
    );
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('exige STARTTLS quando SMTP_SECURE=false e permite transporte ausente sem host', () => {
    const create = vi
      .spyOn(nodemailer, 'createTransport')
      .mockReturnValue(client as ReturnType<typeof nodemailer.createTransport>);
    smtpProvider.useFactory(
      new ConfigService<Environment, true>({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        requireTLS: true,
      }),
    );
    expect(smtpProvider.useFactory(new ConfigService<Environment, true>())).toBeNull();
  });
});
