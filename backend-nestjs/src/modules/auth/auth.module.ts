import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module.js';
import { EmailModule } from '../../shared/email/email.module.js';
import { AuthEmailsService } from './auth-emails.service.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [DatabaseModule, EmailModule],
  providers: [AuthEmailsService, AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
