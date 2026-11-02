export const DEFAULT_AFTER_LOGIN = "/empresas"

// Caminho interno: começa com uma única barra e não tem barras invertidas nem
// caracteres de controle, que navegadores podem normalizar para "//outro-site".
const INTERNAL_PATH = /^\/(?![/\\])[^\\\u0000-\u001f\u007f]*$/

/** Destino após login ou confirmação, restrito a caminhos internos do sistema. */
export function safeNextPath(value: unknown) {
  return typeof value === "string" && INTERNAL_PATH.test(value)
    ? value
    : DEFAULT_AFTER_LOGIN
}

/** Monta o link de uma página de autenticação preservando o destino. */
export function withNext(path: string, next: string | undefined) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path
}
