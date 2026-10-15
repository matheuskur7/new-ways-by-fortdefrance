import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { EmailService } from '../../../../src/shared/email/email.service.js';

vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }));

const settings = {
  FRONTEND_URL: 'https://app.example.com',
  SMTP_HOST: 'smtp.hostinger.com',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_USER: 'sender@example.com',
  SMTP_PASSWORD: 'smtp-test-secret',
  SMTP_FROM: 'New Ways <sender@example.com>',
  SMTP_REPLY_TO: 'support@example.com',
};

describe('EmailService (mocked SMTP)', () => {
  const sendMail = vi.fn();
  const close = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
      close,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
    sendMail.mockResolvedValue({ messageId: 'test' });
  });

  it('sends confirmation using encrypted SMTP and the public frontend proxy', async () => {
    const service = new EmailService(new ConfigService(settings));
    service.sendAuthenticationEmail(
      'verification',
      'user@example.com',
      'http://internal:5000/api/auth/verify-email?token=signed-token&callbackURL=https%3A%2F%2Funtrusted.example',
    );
    await service.onModuleDestroy();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: { user: settings.SMTP_USER, pass: settings.SMTP_PASSWORD },
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: settings.SMTP_FROM,
        replyTo: settings.SMTP_REPLY_TO,
        subject: 'Confirme seu e-mail — New Ways',
        text: expect.stringContaining(
          'https://app.example.com/api/auth/verify-email?token=signed-token&callbackURL=https%3A%2F%2Fapp.example.com%2Fverify-email%3Fverified%3D1',
        ),
        html: expect.stringContaining('&amp;callbackURL='),
        disableFileAccess: true,
        disableUrlAccess: true,
      }),
    );
    expect(close).toHaveBeenCalled();
  });

  it('uses STARTTLS on port 587 and provides a reset link and plain text alternative', async () => {
    const service = new EmailService(
      new ConfigService({
        ...settings,
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
      }),
    );
    service.sendAuthenticationEmail(
      'password-reset',
      'user@example.com',
      'http://internal:5000/api/auth/reset-password/secret-token?callbackURL=ignored',
    );
    await service.onModuleDestroy();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false, requireTLS: true }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Redefina sua senha — New Ways',
        text: expect.stringContaining(
          'callbackURL=https%3A%2F%2Fapp.example.com%2Freset-password',
        ),
      }),
    );
  });

  it('does not wait on SMTP and logs failures without credentials or token URLs', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    try {
      sendMail.mockRejectedValueOnce(
        new Error('smtp-test-secret secret-token user@example.com'),
      );
      const service = new EmailService(new ConfigService(settings));
      expect(
        service.sendAuthenticationEmail(
          'password-reset',
          'user@example.com',
          'http://internal:5000/api/auth/reset-password/secret-token',
        ),
      ).toBeUndefined();
      await service.onModuleDestroy();
      expect(log).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(log.mock.calls)).not.toMatch(
        /smtp-test-secret|secret-token|user@example.com/,
      );
    } finally {
      log.mockRestore();
    }
  });

  it('rejects missing SMTP credentials without silently sending from another account', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    try {
      const service = new EmailService(
        new ConfigService({ ...settings, SMTP_PASSWORD: '' }),
      );
      service.sendAuthenticationEmail(
        'verification',
        'user@example.com',
        'http://internal:5000/api/auth/verify-email?token=test',
      );
      await service.onModuleDestroy();
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });
});
