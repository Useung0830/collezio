import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updatePublicProfile } from "@/features/user/api/updatePublicProfile";
import { profileQueryKeys } from "@/features/user/queries/profileQueryKeys";

import { firebaseAuth } from "@/lib/firebase";

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePublicProfile,
    retry: false,
    onSuccess: (profile) => {
      if (firebaseAuth.currentUser?.uid !== profile.id) return;
      queryClient.setQueryData(
        profileQueryKeys.detail(profile.id, profile.id),
        profile,
      );
    },
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({
        queryKey: ["profiles", input.userId],
      });
    },
  });
}
