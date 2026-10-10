import { ApiProperty } from '@nestjs/swagger';
import { ImageResponse } from './image-response.dto.js';

export class GetImageResponse extends ImageResponse {
  @ApiProperty({
    type: String,
    format: 'uri',
    description: 'URL de leitura assinada, válida por 900 segundos.',
  })
  url: string;
}
