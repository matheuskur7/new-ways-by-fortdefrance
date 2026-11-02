// SVGs do banco são exibidos como imagem, sem executar HTML na página.
export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
