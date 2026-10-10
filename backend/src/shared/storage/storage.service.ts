// storage.service.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: configService.getOrThrow<string>('S3_REGION'),
      endpoint: configService.getOrThrow<string>('S3_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('S3_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>('S3_KEY_SECRET'),
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    this.bucket = configService.getOrThrow<string>('S3_BUCKET');
  }

  async getPresignedUrl(key: string, expiresIn = 30) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async getPresignedUploadUrl(key: string, mimetype: string, expiresIn = 30) {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimetype,
      }),
      { expiresIn },
    );
  }

  async delete(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
