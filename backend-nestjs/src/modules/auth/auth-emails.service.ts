import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../shared/config/env.js';
import { EmailService } from '../../shared/email/email.service.js';
import type { RenderedEmail } from '../../shared/email/templates/email-layout.js';
import {
  emailVerificationEmail,
  memberRoleChangedEmail,
  organizationInvitationEmail,
  passwordResetEmail,
} from './emails/auth-email.templates.js';

/** Validade, em segundos, dos links enviados por e-mail. */
export const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
export const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;
/** Intervalo mínimo entre e-mails de confirmação para o mesmo endereço. */
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

type EmailUser = { name: string; email: string };

export type InvitationEmailData = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  organizationName: string;
  inviter: EmailUser;
};

export type MemberRoleChangedEmailData = {
  user: EmailUser;
  organizationName: string;
  previousRole: string;
  role: string;
};

/** Contrato usado pelas opções do Better Auth; permite simular o envio em testes e na CLI. */
export type AuthEmailSender = {
  sendPasswordReset(data: { user: EmailUser; token: string }): Promise<void>;
  sendEmailVerification(data: { user: EmailUser; url: string }): Promise<void>;
  sendInvitation(data: InvitationEmailData): Promise<void>;
  sendMemberRoleChanged(data: MemberRoleChangedEmailData): Promise<void>;
};

const DEFAULT_AFTER_VERIFICATION = '/empresas';

/**
 * Mantém somente caminhos internos do frontend como destino após a verificação,
 * descartando URLs absolutas de outras origens.
 */
export function safeRedirectPath(value: string | null | undefined, frontendUrl: string) {
  if (!value) return DEFAULT_AFTER_VERIFICATION;
  try {
    const frontend = new URL(frontendUrl);
    const target = new URL(value, frontend);
    if (target.origin !== frontend.origin) return DEFAULT_AFTER_VERIFICATION;
    const path = `${target.pathname}${target.search}`;
    return path === '/' ? DEFAULT_AFTER_VERIFICATION : path;
  } catch {
    return DEFAULT_AFTER_VERIFICATION;
  }
}

@Injectable()
export class AuthEmailsService implements AuthEmailSender {
  /** Último envio de confirmação por e-mail, em memória: limita reenvios pelo endpoint público. */
  private readonly lastVerificationAt = new Map<string, number>();

  constructor(
    @Inject(EmailService) private readonly email: EmailService,
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
  ) {}

  private frontendUrl(path: string, query: Record<string, string> = {}) {
    const url = new URL(path, this.config.get('FRONTEND_URL', { infer: true }));
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    return url.toString();
  }

  private async deliver(to: string, message: RenderedEmail) {
    await this.email.send({ to, ...message });
  }

  async sendPasswordReset({ user, token }: { user: EmailUser; token: string }) {
    const url = this.frontendUrl('/redefinir-senha', { token });
    await this.deliver(
      user.email,
      passwordResetEmail({ name: user.name, url, expiresIn: PASSWORD_RESET_TTL_SECONDS }),
    );
  }

  /**
   * O link aponta para a página do frontend, que confirma o token pelo proxy do
   * backend; assim o cookie da sessão criada fica na origem do frontend.
   */
  async sendEmailVerification({ user, url }: { user: EmailUser; url: string }) {
    const original = new URL(url);
    const token = original.searchParams.get('token');
    if (!token) throw new Error('Link de verificação sem token.');
    if (!this.reserveVerificationSlot(user.email)) return;
    const next = safeRedirectPath(
      original.searchParams.get('callbackURL'),
      this.config.get('FRONTEND_URL', { infer: true }),
    );
    await this.deliver(
      user.email,
      emailVerificationEmail({
        name: user.name,
        email: user.email,
        url: this.frontendUrl('/verificar-email', { token, next }),
        expiresIn: EMAIL_VERIFICATION_TTL_SECONDS,
      }),
    );
  }

  /**
   * Reserva o envio se o intervalo mínimo passou. Dentro do intervalo, o pedido é
   * ignorado em silêncio: a resposta do endpoint continua genérica.
   */
  private reserveVerificationSlot(email: string, now = Date.now()) {
    const key = email.toLowerCase();
    const cooldown = VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000;
    const last = this.lastVerificationAt.get(key);
    if (last !== undefined && now - last < cooldown) return false;
    for (const [entry, sentAt] of this.lastVerificationAt) {
      if (now - sentAt >= cooldown) this.lastVerificationAt.delete(entry);
    }
    this.lastVerificationAt.set(key, now);
    return true;
  }

  async sendInvitation(data: InvitationEmailData) {
    await this.deliver(
      data.email,
      organizationInvitationEmail({
        organizationName: data.organizationName,
        inviterName: data.inviter.name,
        inviterEmail: data.inviter.email,
        role: data.role,
        expiresAt: new Date(data.expiresAt),
        url: this.frontendUrl(`/convite/${encodeURIComponent(data.id)}`),
      }),
    );
  }

  async sendMemberRoleChanged(data: MemberRoleChangedEmailData) {
    await this.deliver(
      data.user.email,
      memberRoleChangedEmail({
        name: data.user.name,
        organizationName: data.organizationName,
        previousRole: data.previousRole,
        role: data.role,
        changedAt: new Date(),
        url: this.frontendUrl('/empresas'),
      }),
    );
  }
}
