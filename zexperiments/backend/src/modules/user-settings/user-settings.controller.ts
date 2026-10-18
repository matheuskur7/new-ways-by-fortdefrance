import {
  Body,
  Controller,
  Delete,
  Header,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UserSettingsService } from './user-settings.service.js';

@ApiTags('User settings')
@ApiCookieAuth()
@Controller('api/user-settings')
export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  @Post('avatar-upload')
  @Header('Cache-Control', 'private, no-store')
  createUpload(@Req() request: AuthenticatedRequest) {
    return this.service.createUpload(request.authSession.user.id);
  }

  @Delete('avatar')
  removeImage(@Req() request: AuthenticatedRequest) {
    return this.service.removeImage(request.authSession.user.id);
  }

  @Patch()
  update(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.service.update(request.authSession.user.id, dto);
  }
}
