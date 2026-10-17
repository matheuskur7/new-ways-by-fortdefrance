import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import type { Environment } from '../config/env.js';

export const SMTP_TRANSPORT = Symbol('SMTP_TRANSPORT');
export type EmailTransport = Pick<Transporter<SMTPTransport.SentMessageInfo>, 'sendMail' | 'close'>;

export const smtpProvider = {
  provide: SMTP_TRANSPORT,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Environment, true>): EmailTransport | null => {
    const host = config.get('SMTP_HOST', { infer: true });
    if (!host) return null;
    const secure = config.get('SMTP_SECURE', { infer: true });
    return nodemailer.createTransport({
      host,
      port: config.get('SMTP_PORT', { infer: true }),
      secure,
      requireTLS: !secure,
      auth: {
        user: config.get('SMTP_USER', { infer: true }),
        pass: config.get('SMTP_PASSWORD', { infer: true }),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  },
};
