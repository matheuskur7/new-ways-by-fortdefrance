import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export function setupDocumentation(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Backend NestJS')
    .setDescription('API com upload de imagens direto ao S3 por URLs pré-assinadas.')
    .setVersion('1.0.0')
    .addCookieAuth('better-auth.session_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: '/openapi.json',
  });
  app.use(
    '/docs',
    apiReference({
      sources: [
        { url: '/openapi.json', title: 'API' },
        {
          url: '/api/auth/open-api/generate-schema',
          title: 'Auth e organizações',
        },
      ],
    }),
  );
  return document;
}
