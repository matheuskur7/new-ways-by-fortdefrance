import { Controller, Get, Header, Req } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth.guard.js';
import { AuthContextResponse } from './auth-context.response.dto.js';
import { ErrorResponseDto } from '../../shared/http/error-response.dto.js';

@ApiTags('Auth')
@ApiCookieAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Get('context')
  @Header('Cache-Control', 'private, no-store')
  @ApiOkResponse({ type: AuthContextResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  getContext(@Req() request: AuthenticatedRequest) {
    return this.service.getContext(request.authSession);
  }
}
