import { z } from 'zod';
import { IMAGE_KEYS } from '../../../shared/storage/image-keys.js';

export const uploadImageSchema = z.strictObject({
  key: z
    .enum(IMAGE_KEYS)
    .describe('Pasta/prefixo da imagem no S3. Por enquanto, apenas user-image.'),
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
  headers: z.object({ 'If-None-Match': z.literal('*') }),
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
