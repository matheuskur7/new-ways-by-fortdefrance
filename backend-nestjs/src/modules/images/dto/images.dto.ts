import { z } from 'zod';
import { IMAGE_KEYS } from '../../../shared/storage/image-keys.js';

export const uploadImageSchema = z.strictObject({
  key: z
    .enum(IMAGE_KEYS)
    .describe('Prefixo de imagem de empresa. Nenhum prefixo habilitado atualmente.'),
});
export type UploadImageDto = z.infer<typeof uploadImageSchema>;

export const imageParamsSchema = z.object({ id: z.uuid() });
export type ImageParamsDto = z.infer<typeof imageParamsSchema>;

export const uploadResponseSchema = z.object({
  id: z.uuidv7(),
  key: z.string(),
  status: z.literal('pending'),
  url: z.url(),
  method: z.literal('PUT'),
  expiresIn: z.number(),
  headers: z.object({ 'If-None-Match': z.literal('*').optional() }),
});
export const imageResponseSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  contentType: z.string().nullable(),
  size: z.number().nullable(),
  status: z.enum(['pending', 'ready']),
});
export const downloadResponseSchema = z.object({
  url: z.url(),
  expiresIn: z.number(),
});
