export class PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
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
