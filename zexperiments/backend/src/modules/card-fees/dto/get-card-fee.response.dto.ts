import { ApiProperty } from '@nestjs/swagger';

export class GetCardFeeResponseDto {
  @ApiProperty({ type: 'integer', minimum: 1, maximum: 12 })
  installments: number;

  @ApiProperty({
    type: String,
    pattern: '^(?:0|[1-9][0-9]?)\\.[0-9]{2}$',
    description:
      'Percentual decimal entre 0.00 e 99.99; "3.94" equivale a 3,94%.',
    example: '3.94',
  })
  ratePercent: string;
}
