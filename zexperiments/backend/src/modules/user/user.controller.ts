import {
  Body,
  Controller,
  Delete,
  Header,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { fromNodeHeaders } from 'better-auth/node';
import { AuthService } from '../auth/auth.service.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';
import { UserService } from './user.service.js';

@ApiTags('Users')
@ApiCookieAuth()
@Controller('api/users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly auth: AuthService,
  ) {}

  @Delete('me')
  @Header('Cache-Control', 'private, no-store')
  async deleteAccount(
    @Req() request: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ) {
    try {
      await this.auth.auth.api.verifyPassword({
        headers: fromNodeHeaders(request.headers),
        body: { password: dto.password },
      });
    } catch {
      throw new UnauthorizedException(
        'Não foi possível confirmar sua senha. Entre novamente e tente outra vez.',
      );
    }
    return this.users.softDelete(request.authSession.user.id);
  }
}
