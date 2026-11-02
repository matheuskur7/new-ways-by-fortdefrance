// Destino da troca de aba em andamento. Permite que o PageTransition troque a
// animação de entrada padrão pelo deslize direcional da View Transition.
let pendingTabHref: string | null = null

export const tabTransitionTypes = {
  forward: "tab-forward",
  back: "tab-back",
} as const

export function markTabNavigation(href: string) {
  // Sem suporte à API, mantém a animação de entrada padrão das páginas.
  if ("startViewTransition" in document) pendingTabHref = href
}

export function isTabNavigation(pathname: string) {
  return pendingTabHref === pathname
}

export function clearTabNavigation(pathname: string) {
  if (pendingTabHref === pathname) pendingTabHref = null
}
