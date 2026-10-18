import { Controller, Get, Header, Inject, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { Session } from '../auth/session.decorator.js';
import type { AuthSession } from '../auth/auth.factory.js';
import { OrganizationService } from './organization.service.js';
import { organizationListResponseSchema } from './dto/organizations.dto.js';

@ApiTags('Organizations')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sessão ausente ou expirada.' })
@UseGuards(AuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(@Inject(OrganizationService) private readonly organizations: OrganizationService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Listar empresas e papéis do usuário autenticado' })
  @ApiOkResponse({ standardSchema: organizationListResponseSchema })
  list(@Session() session: AuthSession) {
    return this.organizations.list(session);
  }
}
