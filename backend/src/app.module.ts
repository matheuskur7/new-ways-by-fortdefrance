import { UserSettingsModule } from './modules/user-settings/user-settings.module.js';
import { DbModule } from './shared/db/db.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CardFeesModule } from './modules/card-fees/card-fees.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageModule } from './modules/image/image.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CustomerModule } from './modules/customer/customer.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    ImageModule,
    CardFeesModule,
    UserSettingsModule,
    CustomerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
