import { escapeHtml } from './escape-html.js';

export type EmailDetail = { label: string; value: string };

/** Card interno, equivalente ao `DialogSection` dos modais do sistema. */
export type EmailSection = {
  title: string;
  description?: string;
  details: EmailDetail[];
};

export type EmailAction = { label: string; url: string };

/** Conteúdo de um e-mail com o visual dos modais. Todos os textos são simples e escapados. */
export type EmailContent = {
  subject: string;
  /** Resumo exibido pelos clientes de e-mail ao lado do assunto. */
  preheader: string;
  title: string;
  description: string;
  greeting?: string;
  paragraphs: string[];
  sections?: EmailSection[];
  action: EmailAction;
  /** Observação discreta exibida depois do botão. */
  notice?: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

// Tokens do tema do frontend (globals.css), convertidos para cores compatíveis com e-mail.
const colors = {
  primary: '#FF001C',
  primaryForeground: '#ffffff',
  foreground: '#4a4a4a',
  mutedForeground: '#737373',
  muted: '#f5f5f5',
  footer: '#f9f9f9',
  border: '#e5e5e5',
  card: '#ffffff',
};
const font = "Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const brandFont = 'Arial, Helvetica, sans-serif';

function assertHttpUrl(url: string) {
  const protocol = new URL(url).protocol;
  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error('O link do e-mail deve usar HTTP ou HTTPS.');
  }
}

function paragraph(text: string, style = '') {
  return `<p style="margin:0 0 16px;font-family:${font};font-size:14px;line-height:22px;color:${colors.foreground};${style}">${escapeHtml(text)}</p>`;
}

function renderSection(section: EmailSection) {
  const description = section.description
    ? `<p style="margin:4px 0 0;font-family:${font};font-size:14px;line-height:20px;color:${colors.mutedForeground};">${escapeHtml(section.description)}</p>`
    : '';
  const rows = section.details
    .map(
      (detail, index) => `
            <tr>
              <td style="padding:10px 0;${index ? `border-top:1px solid ${colors.border};` : ''}font-family:${font};font-size:13px;line-height:18px;color:${colors.mutedForeground};white-space:nowrap;vertical-align:top;">${escapeHtml(detail.label)}</td>
              <td align="right" style="padding:10px 0 10px 16px;${index ? `border-top:1px solid ${colors.border};` : ''}font-family:${font};font-size:13px;line-height:18px;font-weight:600;color:${colors.foreground};text-align:right;vertical-align:top;word-break:break-word;">${escapeHtml(detail.value)}</td>
            </tr>`,
    )
    .join('');
  return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid ${colors.border};border-radius:7px;border-collapse:separate;background:${colors.card};">
          <tr>
            <td style="padding:16px;">
              <p style="margin:0;font-family:${font};font-size:14px;line-height:20px;font-weight:600;color:${colors.foreground};">${escapeHtml(section.title)}</p>
              ${description}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">${rows}
              </table>
            </td>
          </tr>
        </table>`;
}

function renderButton(action: EmailAction) {
  const href = escapeHtml(action.url);
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right">
                <tr>
                  <td bgcolor="${colors.primary}" style="border-radius:6px;background:${colors.primary};">
                    <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;padding:11px 20px;font-family:${font};font-size:14px;line-height:18px;font-weight:600;color:${colors.primaryForeground};text-decoration:none;border-radius:6px;">${escapeHtml(action.label)}</a>
                  </td>
                </tr>
              </table>`;
}

/** Monta o HTML com tabelas e estilos inline, compatível com os principais clientes de e-mail. */
export function renderEmailHtml(content: EmailContent) {
  assertHttpUrl(content.action.url);
  const href = escapeHtml(content.action.url);
  const greeting = content.greeting ? paragraph(content.greeting, 'font-weight:600;') : '';
  const paragraphs = content.paragraphs.map((text) => paragraph(text)).join('');
  const sections = (content.sections ?? []).map(renderSection).join('');
  const notice = content.notice
    ? `<p style="margin:16px 0 0;font-family:${font};font-size:13px;line-height:20px;color:${colors.mutedForeground};">${escapeHtml(content.notice)}</p>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.muted};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(content.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.muted}" style="background:${colors.muted};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 20px;font-family:${brandFont};">
              <div style="font-size:30px;line-height:30px;font-weight:700;letter-spacing:-1px;color:${colors.foreground};"><span style="color:${colors.primary};font-style:italic;">New</span> Ways</div>
              <div style="font-size:12px;line-height:16px;font-style:italic;color:${colors.foreground};">by <strong>Fort de France</strong></div>
              <div style="width:40px;height:3px;margin:12px auto 0;border-radius:3px;background:${colors.primary};font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="background:${colors.card};border:1px solid ${colors.border};border-radius:10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:24px 24px 0;">
                    <div style="padding:0 0 16px;border-bottom:1px solid ${colors.border};">
                      <h1 style="margin:0;font-family:${font};font-size:18px;line-height:24px;font-weight:600;color:${colors.foreground};">${escapeHtml(content.title)}</h1>
                      <p style="margin:4px 0 0;font-family:${font};font-size:14px;line-height:20px;color:${colors.mutedForeground};">${escapeHtml(content.description)}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 24px 4px;">
                    ${greeting}${paragraphs}${sections}
                    <p style="margin:0 0 20px;font-family:${font};font-size:13px;line-height:20px;color:${colors.mutedForeground};">Se o botão não funcionar, copie e cole este link no navegador:<br><a href="${href}" target="_blank" rel="noopener" style="color:${colors.primary};text-decoration:underline;word-break:break-all;">${href}</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;background:${colors.footer};border-top:1px solid ${colors.border};border-radius:0 0 10px 10px;">${renderButton(content.action)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 8px 0;">
              ${notice}
              <p style="margin:12px 0 0;font-family:${font};font-size:12px;line-height:18px;color:${colors.mutedForeground};">Mensagem automática do New Ways · Sistema de Gestão para Oficinas.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Versão em texto puro, para clientes sem HTML e filtros de spam. */
export function renderEmailText(content: EmailContent) {
  assertHttpUrl(content.action.url);
  const blocks = [
    `${content.title}\n${content.description}`,
    content.greeting,
    ...content.paragraphs,
    ...(content.sections ?? []).map((section) =>
      [
        section.title,
        section.description,
        ...section.details.map((detail) => `${detail.label}: ${detail.value}`),
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    `${content.action.label}:\n${content.action.url}`,
    content.notice,
    'New Ways by Fort de France · Sistema de Gestão para Oficinas',
  ];
  return blocks.filter(Boolean).join('\n\n');
}

export function renderEmail(content: EmailContent): RenderedEmail {
  return {
    // Remove quebras de linha que dados dinâmicos possam introduzir no assunto.
    subject: content.subject.replace(/[\r\n]+/g, ' ').trim(),
    html: renderEmailHtml(content),
    text: renderEmailText(content),
  };
}
