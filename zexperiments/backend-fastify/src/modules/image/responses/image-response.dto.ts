import { ApiProperty } from '@nestjs/swagger';

export class ImageResponse {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '019a0000-0000-7000-8000-000000000001',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'car-image/019a0000-0000-7000-8000-000000000001',
  })
  key: string;

  @ApiProperty({ type: String, example: 'car-image' })
  tag: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  serviceOrderId: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  userId: string | null;
}
