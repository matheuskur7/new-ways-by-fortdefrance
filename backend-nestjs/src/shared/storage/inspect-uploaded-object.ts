import { BadRequestException } from '@nestjs/common';
import { S3ServiceException } from '@aws-sdk/client-s3';
import type { StorageService } from './storage.service.js';

export async function inspectUploadedObject(storage: StorageService, key: string) {
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
  return { contentType, size };
}
