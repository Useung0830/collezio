import { useEffect, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, onSnapshot } from "firebase/firestore";

import { getChatBlockStatus } from "@/features/chat/api/getChatBlockStatus";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export function useChatBlockStatus(
  userId: string | null | undefined,
  partnerId: string | null,
) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([userId, partnerId]);
  const query = useQuery({
    queryKey: chatQueryKeys.block(userId, partnerId),
    queryFn:
      userId && partnerId && userId !== partnerId
        ? () => getChatBlockStatus(userId, partnerId)
        : skipToken,
    retry: false,
    gcTime: 0,
  });

  useEffect(() => {
    if (!userId || !partnerId || userId === partnerId) return;
    const queryKey = chatQueryKeys.block(userId, partnerId);
    const unsubscribe = [
      [userId, partnerId],
      [partnerId, userId],
    ].map(([ownerId, targetId]) =>
      onSnapshot(
        doc(firebaseDb, "users", ownerId, "chatBlocks", targetId),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (
            firebaseAuth.currentUser?.uid !== userId ||
            snapshot.metadata.fromCache ||
            snapshot.metadata.hasPendingWrites
          )
            return;
          void queryClient.invalidateQueries({ queryKey, exact: true });
        },
        () => setFailure(key),
      ),
    );
    return () => unsubscribe.forEach((stop) => stop());
  }, [userId, partnerId, queryClient, key, revision]);

  return {
    ...query,
    isError: query.isError || failure === key,
    isBlocked: Boolean(
      query.data?.isBlockedByMe || query.data?.isBlockedByPartner,
    ),
    refetch: () => {
      setFailure(null);
      setRevision((value) => value + 1);
      return query.refetch();
    },
  };
}
