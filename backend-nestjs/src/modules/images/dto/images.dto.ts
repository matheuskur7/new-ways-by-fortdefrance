import { z } from 'zod';

export const uploadImageSchema = z.strictObject({
  filename: z.string().trim().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  size: z.number().int().positive().max(104857600),
  checksum: z
    .string()
    .regex(/^[A-Za-z0-9+/]{43}=$/, 'Informe o SHA-256 em base64.'),
});
export type UploadImageDto = z.infer<typeof uploadImageSchema>;

export const imageParamsSchema = z.object({ id: z.uuid() });
export type ImageParamsDto = z.infer<typeof imageParamsSchema>;

export const uploadResponseSchema = z.object({
  id: z.uuid(),
  url: z.url(),
  method: z.literal('PUT'),
  expiresIn: z.number(),
  headers: z.object({
    'Content-Type': z.string(),
    'Content-Length': z.string(),
    'x-amz-checksum-sha256': z.string(),
  }),
});
export const imageResponseSchema = z.object({
  id: z.uuid(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
  status: z.enum(['pending', 'ready']),
});
export const downloadResponseSchema = z.object({
  url: z.url(),
  expiresIn: z.number(),
});
