export function createPaginatedResponse(
  data: any[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    meta: {
      total,
      page,
      lastPage: Math.ceil(total / limit),
    },
  };
}