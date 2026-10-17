import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { CustomerService } from './customer.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@ApiTags('Customers')
@ApiCookieAuth()
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria cliente na empresa ativa; autoria derivada da sessão.',
  })
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateCustomerDto) {
    return this.service.create(request.authSession, dto);
  }

  @Get(':id')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Consulta cliente da empresa ativa.' })
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ) {
    return this.service.findOne(request.authSession, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza cliente da empresa ativa e registra o autor da edição.',
  })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.service.update(request.authSession, id, dto);
  }
}
