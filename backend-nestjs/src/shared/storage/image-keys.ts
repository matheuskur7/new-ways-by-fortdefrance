// Adicione novos prefixos conforme os domínios forem implementados.
export const IMAGE_KEYS = ['user-image'] as const;
export type ImageKey = (typeof IMAGE_KEYS)[number];
