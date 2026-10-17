import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module.js';
import { UserSettingsService } from './user-settings.service.js';
import { UserSettingsController } from './user-settings.controller.js';

@Module({
  imports: [StorageModule],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
})
export class UserSettingsModule {}
