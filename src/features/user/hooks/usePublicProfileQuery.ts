import { skipToken, useQuery } from "@tanstack/react-query";

import { getPublicProfile } from "@/features/user/api/getPublicProfile";
import { useProfileUserId } from "@/features/user/hooks/useProfileUserId";
import { profileQueryKeys } from "@/features/user/queries/profileQueryKeys";

export function usePublicProfileQuery(userId: string | null | undefined) {
  const viewerId = useProfileUserId();
  return useQuery({
    queryKey: profileQueryKeys.detail(userId, viewerId),
    queryFn:
      userId && viewerId !== undefined
        ? () => getPublicProfile(userId)
        : skipToken,
    staleTime: 60_000,
    retry: false,
  });
}
