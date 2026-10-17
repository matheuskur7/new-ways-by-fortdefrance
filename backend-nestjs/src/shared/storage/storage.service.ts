import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Environment } from '../config/env.js';

@Injectable()
export class StorageService implements OnApplicationShutdown {
  private readonly client: S3Client;
  private readonly bucket: string;
  readonly expiresIn: number;

  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    this.client = new S3Client({
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
    this.bucket = config.get('S3_BUCKET', { infer: true });
    this.expiresIn = config.get('S3_URL_TTL_SECONDS', { infer: true });
  }

  presignUpload(
    key: string,
    contentType: string,
    size: number,
    checksum: string,
  ) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
        ChecksumSHA256: checksum,
      }),
      {
        expiresIn: this.expiresIn,
        signableHeaders: new Set(['content-type', 'content-length']),
        unhoistableHeaders: new Set(['x-amz-checksum-sha256']),
      },
    );
  }

  head(key: string) {
    return this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ChecksumMode: 'ENABLED',
      }),
    );
  }

  presignDownload(key: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: this.expiresIn },
    );
  }

  onApplicationShutdown() {
    this.client.destroy();
  }
}
