import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Environment } from '../config/env.js';

@Injectable()
export class StorageService implements OnApplicationShutdown {
  private readonly client: S3Client;
  private readonly bucket: string;
  readonly expiresIn: number;
  readonly uploadHeaders: { 'If-None-Match'?: '*' };

  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    this.client = new S3Client({
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      region: config.get('S3_REGION', { infer: true }),
      credentials: config.get('S3_KEY_ID', { infer: true })
        ? {
            accessKeyId: config.get('S3_KEY_ID', { infer: true })!,
            secretAccessKey: config.get('S3_KEY_SECRET', { infer: true })!,
          }
        : undefined,
      endpoint: config.get('S3_ENDPOINT', { infer: true }),
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE', { infer: true }),
    });
    this.uploadHeaders = config.get('S3_USE_CONDITIONAL_UPLOAD', { infer: true })
      ? { 'If-None-Match': '*' }
      : {};
    this.bucket = config.get('S3_BUCKET', { infer: true });
    this.expiresIn = config.get('S3_URL_TTL_SECONDS', { infer: true });
  }

  presignUpload(key: string) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ...(this.uploadHeaders['If-None-Match'] ? { IfNoneMatch: '*' } : {}),
      }),
      {
        expiresIn: this.expiresIn,
        signableHeaders: new Set(
          Object.keys(this.uploadHeaders).map((header) => header.toLowerCase()),
        ),
      },
    );
  }

  head(key: string) {
    return this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  presignDownload(key: string, expiresIn = this.expiresIn) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn },
    );
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  onApplicationShutdown() {
    this.client.destroy();
  }
}
