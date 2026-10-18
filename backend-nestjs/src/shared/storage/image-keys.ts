// Prefixos de imagens de empresas serão habilitados conforme os domínios.
// Fotos pessoais são validadas exclusivamente pelo módulo user-images.
export const IMAGE_KEYS = [] as const;
export type ImageKey = (typeof IMAGE_KEYS)[number];
