import { renderEmail } from '../../../shared/email/templates/email-layout.js';

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim();
}

function greeting(name: string) {
  const first = firstName(name);
  return first ? `Olá, ${first}!` : 'Olá!';
}

function formatDuration(seconds: number) {
  const hours = Math.round(seconds / 3600);
  if (hours >= 24 && hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? '24 horas' : `${days} dias`;
  }
  if (hours >= 1) return hours === 1 ? '1 hora' : `${hours} horas`;
  return `${Math.max(1, Math.round(seconds / 60))} minutos`;
}

export function formatRoles(role: string) {
  return role
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => roleLabels[value] ?? value)
    .join(', ');
}

export function formatDateTime(date: Date) {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
  return formatted.replace(', ', ' às ');
}

export function passwordResetEmail(data: { name: string; url: string; expiresIn: number }) {
  const duration = formatDuration(data.expiresIn);
  return renderEmail({
    subject: 'Redefinição de senha · New Ways',
    preheader: `Crie uma nova senha para sua conta. O link expira em ${duration}.`,
    title: 'Redefinir senha',
    description: 'Recebemos uma solicitação para alterar a senha da sua conta.',
    greeting: greeting(data.name),
    paragraphs: [
      `Use o botão abaixo para criar uma nova senha. Por segurança, o link expira em ${duration} e só pode ser usado uma vez.`,
      'Depois da alteração, as sessões abertas em outros dispositivos serão encerradas.',
    ],
    action: { label: 'Redefinir senha', url: data.url },
    notice: 'Se você não pediu a redefinição, ignore este e-mail. Sua senha atual continua válida.',
  });
}

export function emailVerificationEmail(data: {
  name: string;
  email: string;
  url: string;
  expiresIn: number;
}) {
  const duration = formatDuration(data.expiresIn);
  return renderEmail({
    subject: 'Confirme seu e-mail · New Ways',
    preheader: 'Confirme seu endereço de e-mail para acessar o New Ways.',
    title: 'Confirmar e-mail',
    description: 'Falta pouco para liberar o acesso à sua conta.',
    greeting: greeting(data.name),
    paragraphs: [
      `Confirme que o endereço ${data.email} pertence a você. Depois da confirmação, você entra no sistema automaticamente.`,
      `O link expira em ${duration}. Se ele expirar, entre com seu e-mail e senha e peça um novo link.`,
    ],
    action: { label: 'Confirmar e-mail', url: data.url },
    notice: 'Se você não criou uma conta no New Ways, ignore este e-mail.',
  });
}

export function organizationInvitationEmail(data: {
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  expiresAt: Date;
  url: string;
}) {
  return renderEmail({
    subject: `Convite para ${data.organizationName} · New Ways`,
    preheader: `${data.inviterName} convidou você para a equipe de ${data.organizationName}.`,
    title: 'Convite para a equipe',
    description: `${data.inviterName} convidou você para participar de ${data.organizationName}.`,
    greeting: 'Olá!',
    paragraphs: [
      'Ao aceitar o convite, você passa a acessar a empresa no New Ways com o cargo indicado abaixo.',
      'Se ainda não tem conta, crie uma usando este mesmo endereço de e-mail.',
    ],
    sections: [
      {
        title: 'Detalhes do convite',
        details: [
          { label: 'Empresa', value: data.organizationName },
          { label: 'Cargo', value: formatRoles(data.role) },
          { label: 'Convidado por', value: `${data.inviterName} (${data.inviterEmail})` },
          { label: 'Válido até', value: formatDateTime(data.expiresAt) },
        ],
      },
    ],
    action: { label: 'Ver convite', url: data.url },
    notice: 'Se você não esperava este convite, ignore este e-mail.',
  });
}

export function memberRoleChangedEmail(data: {
  name: string;
  organizationName: string;
  previousRole: string;
  role: string;
  changedAt: Date;
  url: string;
}) {
  const role = formatRoles(data.role);
  return renderEmail({
    subject: `Seu cargo em ${data.organizationName} foi alterado · New Ways`,
    preheader: `Agora você é ${role} em ${data.organizationName}.`,
    title: 'Cargo alterado',
    description: `Seu cargo na equipe de ${data.organizationName} foi atualizado.`,
    greeting: greeting(data.name),
    paragraphs: [
      `Um administrador da empresa alterou seu cargo para ${role}. As permissões do novo cargo já estão valendo.`,
    ],
    sections: [
      {
        title: 'Detalhes da alteração',
        details: [
          { label: 'Empresa', value: data.organizationName },
          { label: 'Cargo anterior', value: formatRoles(data.previousRole) },
          { label: 'Novo cargo', value: role },
          { label: 'Alterado em', value: formatDateTime(data.changedAt) },
        ],
      },
    ],
    action: { label: 'Acessar o sistema', url: data.url },
    notice:
      'Se você não reconhece esta alteração, fale com o proprietário ou um administrador da empresa.',
  });
}
