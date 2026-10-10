import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CarImageModule } from './modules/car-image/car-image.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CarImageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
