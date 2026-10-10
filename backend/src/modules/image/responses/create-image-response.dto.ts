import { ApiProperty } from '@nestjs/swagger';
import { GetImageResponse } from './get-image.response.dto.js';

export class CreateImageResponse {
  @ApiProperty({ type: () => GetImageResponse })
  imageData: GetImageResponse;

  @ApiProperty({
    type: String,
    format: 'uri',
    description:
      'URL de upload por PUT, válida por 300 segundos. Use Content-Type: image/*.',
  })
  uploadUrl: string;
}
