import { ApiProperty } from '@nestjs/swagger';
import { GetCardFeeResponseDto } from './get-card-fee.response.dto.js';

export class GetCardFeeGroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  channel: string;

  @ApiProperty({ type: String, nullable: true, maxLength: 30000 })
  logoSvg: string | null;

  @ApiProperty({ type: [GetCardFeeResponseDto] })
  rates: GetCardFeeResponseDto[];
}
