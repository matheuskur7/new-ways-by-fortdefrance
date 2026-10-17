import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export function setupDocumentation(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Backend NestJS')
    .setDescription(
      'API com upload de imagens direto ao S3 por URLs pré-assinadas.',
    )
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: '/openapi.json',
  });
  app.use('/docs', apiReference({ url: '/openapi.json' }));
  return document;
}
