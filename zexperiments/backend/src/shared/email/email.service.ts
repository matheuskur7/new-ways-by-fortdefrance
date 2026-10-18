import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type AuthenticationEmail = 'verification' | 'password-reset';

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  );
}

@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private transport?: Transporter;
  private readonly pending = new Set<Promise<void>>();

  constructor(private readonly config: ConfigService) {}

  // Dispatch without making public auth responses depend on SMTP latency or account existence.
  sendAuthenticationEmail(
    kind: AuthenticationEmail,
    to: string,
    url: string,
  ): void {
    const task = this.send(kind, to, url).catch(() => {
      // SMTP errors may contain credentials, recipient addresses or signed URLs.
      this.logger.error(
        'Falha no envio de e-mail de autenticação. Confira a configuração SMTP e o provedor.',
      );
    });
    this.pending.add(task);
    void task.finally(() => this.pending.delete(task));
  }

  async sendOrganizationInvitationEmail(
    to: string,
    organizationName: string,
    invitationId: string,
  ): Promise<void> {
    const link = new URL(
      `/invitations/${encodeURIComponent(invitationId)}`,
      this.config.getOrThrow<string>('FRONTEND_URL'),
    ).href;
    const description = `Você recebeu um convite para participar de ${organizationName} no New Ways.`;
    try {
      await this.getTransport().sendMail({
        from: this.config.getOrThrow<string>('SMTP_FROM'),
        to,
        replyTo: this.config.get<string>('SMTP_REPLY_TO') || undefined,
        subject: 'Convite para uma empresa — New Ways',
        text: `${description}\n\nAcesse com a conta deste e-mail e aceite o convite: ${link}\n\nO convite é válido por 48 horas.`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif"><h1>Convite para uma empresa</h1><p>${escapeHtml(description)}</p><p><a href="${escapeHtml(link)}">Ver convite</a></p><p>Acesse com a conta deste e-mail. O convite é válido por 48 horas.</p></div>`,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
    } catch {
      this.logger.error(
        'Falha no envio do convite. Confira a configuração SMTP e o provedor.',
      );
      throw new Error(
        'Não foi possível enviar o convite por e-mail. Tente reenviar.',
      );
    }
  }

  private getTransport() {
    if (this.transport) return this.transport;
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? '465');
    const secure = this.config.get<string>('SMTP_SECURE') ?? 'true';
    if (
      !host ||
      !user ||
      !pass ||
      !this.config.get<string>('SMTP_FROM') ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !['true', 'false'].includes(secure)
    ) {
      throw new Error('Configure as variáveis SMTP no backend.');
    }
    this.transport = nodemailer.createTransport({
      host,
      port,
      secure: secure === 'true',
      requireTLS: secure === 'false',
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      logger: false,
      debug: false,
    });
    return this.transport;
  }

  private async send(kind: AuthenticationEmail, to: string, url: string) {
    const frontend = new URL(this.config.getOrThrow<string>('FRONTEND_URL'))
      .origin;
    const link = new URL(url);
    // Publish links through the frontend proxy, so cookies and redirects use the public origin.
    if (!link.pathname.startsWith('/api/auth/'))
      throw new Error('Link de autenticação inválido.');
    const publicLink = new URL(link.pathname + link.search, frontend);
    publicLink.searchParams.set(
      'callbackURL',
      new URL(
        kind === 'verification'
          ? '/verify-email?verified=1'
          : '/reset-password',
        frontend,
      ).href,
    );
    const verification = kind === 'verification';
    const title = verification ? 'Confirme seu e-mail' : 'Redefina sua senha';
    const action = verification ? 'Confirmar e-mail' : 'Redefinir senha';
    const description = verification
      ? 'Confirme seu endereço de e-mail para entrar no New Ways.'
      : 'Recebemos uma solicitação para redefinir sua senha do New Ways.';
    const text = `${description}\n\n${action}: ${publicLink.href}\n\nO link é válido por 1 hora. Se você não fez esta solicitação, ignore esta mensagem.`;
    await this.getTransport().sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to,
      replyTo: this.config.get<string>('SMTP_REPLY_TO') || undefined,
      subject: `${title} — New Ways`,
      text,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto"><h1>${title}</h1><p>${description}</p><p><a href="${escapeHtml(publicLink.href)}">${action}</a></p><p>O link é válido por 1 hora.</p><p>Se você não fez esta solicitação, ignore esta mensagem.</p><p>New Ways<br>by Fort de France</p></div>`,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }

  async onModuleDestroy() {
    await Promise.all(this.pending);
    this.transport?.close();
  }
}
