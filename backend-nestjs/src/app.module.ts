import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserImagesModule } from './modules/user-images/user-images.module.js';
import { ImagesModule } from './modules/images/images.module.js';
import { validateEnv } from './shared/config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrganizationModule } from './modules/organization/organization.module.js';
import { UserModule } from './modules/user/user.module.js';
import { EmailModule } from './shared/email/email.module.js';
import { CardFeesModule } from './modules/card-fees/card-fees.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      skipProcessEnv: true,
      validate: validateEnv,
    }),
    ImagesModule,
    UserImagesModule,
    AuthModule,
    OrganizationModule,
    UserModule,
    EmailModule,
    CardFeesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_PIPE, useClass: StandardSchemaValidationPipe }],
})
export class AppModule {}
