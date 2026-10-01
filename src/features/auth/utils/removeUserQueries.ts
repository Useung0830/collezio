import type { QueryClient } from "@tanstack/react-query";

export function removeUserQueries(queryClient: QueryClient, userId: string) {
  // 사용자별 쿼리 키에는 UID가 포함됩니다. 제거 시 진행 중인 조회도 취소됩니다.
  queryClient.removeQueries({
    predicate: (query) => query.queryKey.includes(userId),
  });
}
