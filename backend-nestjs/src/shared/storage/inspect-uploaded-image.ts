import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { S3ServiceException } from '@aws-sdk/client-s3';
import type { Environment } from '../config/env.js';
import type { StorageService } from './storage.service.js';

export async function inspectUploadedImage(
  storage: StorageService,
  config: ConfigService<Environment, true>,
  key: string,
) {
  let object;
  try {
    object = await storage.head(key);
  } catch (error) {
    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
      throw new BadRequestException('Upload ainda não encontrado no S3.');
    }
    throw error;
  }
  const contentType = object.ContentType;
  const size = object.ContentLength;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!contentType || !allowedTypes.includes(contentType)) {
    throw new BadRequestException('O arquivo enviado deve ser uma imagem JPEG, PNG, WebP ou GIF.');
  }
  if (
    size === undefined ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > config.get('MAX_IMAGE_SIZE_BYTES', { infer: true })
  ) {
    throw new BadRequestException('Imagem vazia ou acima do tamanho permitido.');
  }

  return { contentType, size };
}
