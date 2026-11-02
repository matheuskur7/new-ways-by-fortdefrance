import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../../src/shared/email/templates/escape-html.js';
import { renderEmail } from '../../../src/shared/email/templates/email-layout.js';
import type { EmailContent } from '../../../src/shared/email/templates/email-layout.js';

describe('layout de e-mail', () => {
  const content: EmailContent = {
    subject: 'Assunto',
    preheader: 'Resumo',
    title: 'Título',
    description: 'Descrição',
    greeting: 'Olá, Ana!',
    paragraphs: ['Primeiro parágrafo.'],
    sections: [
      {
        title: 'Detalhes',
        description: 'Descrição da seção',
        details: [{ label: 'Empresa', value: 'Oficina' }],
      },
    ],
    action: { label: 'Abrir', url: 'https://app.example.com/acao?token=a&b=c' },
    notice: 'Ignore se não pediu.',
  };

  it('escapa caracteres especiais de HTML', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('gera HTML no visual dos modais e texto puro com o mesmo conteúdo', () => {
    const email = renderEmail(content);
    expect(email.subject).toBe('Assunto');
    expect(email.html).toContain('<html lang="pt-BR">');
    expect(email.html).toContain('#FF001C');
    expect(email.html).toContain('href="https://app.example.com/acao?token=a&amp;b=c"');
    expect(email.html).not.toMatch(/<svg|<img|<script/i);
    for (const text of ['Título', 'Descrição', 'Olá, Ana!', 'Detalhes', 'Empresa', 'Oficina']) {
      expect(email.html).toContain(text);
      expect(email.text).toContain(text);
    }
    expect(email.text).toContain('Abrir:\nhttps://app.example.com/acao?token=a&b=c');
    expect(email.text).toContain('Ignore se não pediu.');
  });

  it('escapa dados dinâmicos no HTML e remove quebras de linha do assunto', () => {
    const email = renderEmail({
      ...content,
      subject: 'Convite\r\nBcc: other@example.com',
      title: '<script>alert(1)</script>',
      sections: [{ title: 'Detalhes', details: [{ label: 'Empresa', value: '"><img src=x>' }] }],
    });
    expect(email.subject).toBe('Convite Bcc: other@example.com');
    expect(email.html).not.toContain('<script>alert(1)</script>');
    expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(email.html).not.toContain('"><img src=x>');
  });

  it('rejeita links que não usam HTTP ou HTTPS', () => {
    expect(() =>
      renderEmail({ ...content, action: { label: 'Abrir', url: 'javascript:alert(1)' } }),
    ).toThrow();
  });
});
