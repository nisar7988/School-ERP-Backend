export function buildPagination(page: number = 1, limit: number = 10) {
  const safeLimit = Math.min(limit, 100);
  const skip = (page - 1) * safeLimit;

  return {
    skip,
    take: safeLimit,
  };
}