export type PaginationParams = {
  page: number;
  perPage: number;
  skip: number;
  take: number;
};

export function getPaginationParams(
  page: number,
  perPage: number,
): PaginationParams {
  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}
