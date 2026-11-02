const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapa texto dinâmico para uso seguro em conteúdo e atributos HTML. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => entities[char]!);
}
