import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ type: Number, example: 1 })
  page: number;
  @ApiProperty({ type: Number, example: 50 })
  perPage: number;
  @ApiProperty({ type: Number, example: 51 })
  total: number;
  @ApiProperty({ type: Number, example: 2 })
  totalPages: number;
  @ApiProperty({ type: Boolean, example: true })
  hasNextPage: boolean;
  @ApiProperty({ type: Boolean, example: false })
  hasPreviousPage: boolean;
}

export class PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / perPage);

  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
