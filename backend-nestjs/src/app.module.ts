import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ImagesModule } from './modules/images/images.module.js';
import { validateEnv } from './shared/config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrganizationModule } from './modules/organization/organization.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      skipProcessEnv: true,
      validate: validateEnv,
    }),
    ImagesModule,
    AuthModule,
    OrganizationModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
  ],
})
export class AppModule {}
