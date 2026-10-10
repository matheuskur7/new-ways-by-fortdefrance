import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

// Adicione aqui novas tags utilizadas pelas aplicações.
// Esta lista também controla os filtros de listagem e as opções no Swagger.
export const ACCEPTED_IMAGE_TAGS = [
  'car-image'
] as const;

export class ImageTagDto {
  @ApiProperty({
    type: String,
    description:
      'Prefixo (pasta) no S3. Letras, números, hífens e underscores.',
    example: ACCEPTED_IMAGE_TAGS[0],
    enum: ACCEPTED_IMAGE_TAGS,
    minLength: 1,
    maxLength: 100,
    pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]*$',
  })
  @IsIn(ACCEPTED_IMAGE_TAGS, { message: 'Tag não permitida.' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, {
    message: 'Tag deve conter apenas letras, números, hífens e underscores.',
  })
  tag: string;
}
