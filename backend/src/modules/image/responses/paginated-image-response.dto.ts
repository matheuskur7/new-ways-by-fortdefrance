import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../../shared/pagination/paginated-response.dto.js';
import { GetImageResponse } from './get-image.response.dto.js';

export class PaginatedImageResponse {
  @ApiProperty({ type: () => [GetImageResponse] })
  data: GetImageResponse[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
