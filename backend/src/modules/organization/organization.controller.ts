import { Controller, Get, Header, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { OrganizationService } from './organization.service.js';

@ApiTags('Organizations')
@ApiCookieAuth()
@Controller('api/organizations')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  list(@Req() request: AuthenticatedRequest) {
    return this.service.listForUser(request.authSession.user.id);
  }
}
