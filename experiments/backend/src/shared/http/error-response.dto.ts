import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ type: Number, example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['tag deve ser uma string'],
  })
  message: string | string[];

  @ApiProperty({ type: String, example: 'Bad Request' })
  error: string;
}
