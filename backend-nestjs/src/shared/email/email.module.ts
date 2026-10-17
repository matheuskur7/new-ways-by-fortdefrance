import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service.js';
import { smtpProvider } from './smtp.provider.js';

@Module({
  imports: [ConfigModule],
  providers: [smtpProvider, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
