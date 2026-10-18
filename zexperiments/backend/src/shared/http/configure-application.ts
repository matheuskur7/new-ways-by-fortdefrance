import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureApplication(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('New Ways API')
    .setDescription('API do Sistema New Ways - by Fort de France.')
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .build();

  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
