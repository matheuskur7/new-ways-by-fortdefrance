import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../config/env.js';
import { sendEmailSchema } from './dto/send-email.dto.js';
import type { SendEmailDto } from './dto/send-email.dto.js';
import { SMTP_TRANSPORT } from './smtp.provider.js';
import type { EmailTransport } from './smtp.provider.js';

@Injectable()
export class EmailService implements OnApplicationShutdown {
  constructor(
    @Inject(SMTP_TRANSPORT) private readonly client: EmailTransport | null,
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
  ) {}

  async send(input: SendEmailDto): Promise<{ id: string }> {
    const parsed = sendEmailSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Dados de e-mail inválidos.');
    const from = this.config.get('SMTP_FROM', { infer: true });
    if (!this.client || !from) {
      throw new ServiceUnavailableException('O serviço de e-mail não está configurado.');
    }
    let response;
    try {
      response = await this.client.sendMail({
        ...parsed.data,
        from,
        replyTo: parsed.data.replyTo ?? this.config.get('SMTP_REPLY_TO', { infer: true }),
      });
    } catch {
      throw new BadGatewayException('Não foi possível enviar o e-mail pelo servidor SMTP.');
    }
    // Não propaga mensagens SMTP, destinatários, conteúdo ou credenciais.
    if (!response.messageId || !response.accepted?.length || response.rejected?.length) {
      throw new BadGatewayException('O servidor SMTP não aceitou todos os destinatários.');
    }
    return { id: response.messageId };
  }

  onApplicationShutdown() {
    this.client?.close();
  }
}
