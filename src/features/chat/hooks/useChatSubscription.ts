import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ChatSubscriptionScope } from "@/features/chat/api/subscribeToChatChanges";
import { subscribeToChatChanges } from "@/features/chat/api/subscribeToChatChanges";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useChatSubscription(
  userId: string | null | undefined,
  scope: ChatSubscriptionScope,
  roomId = "",
) {
  const queryClient = useQueryClient();
  const [revision, setRevision] = useState(0);
  const [failure, setFailure] = useState<{ key: string; error: Error } | null>(
    null,
  );
  const key = JSON.stringify([userId, scope, roomId]);

  const restart = () => {
    setFailure(null);
    setRevision((value) => value + 1);
  };

  useEffect(() => {
    if (
      !userId ||
      (scope !== "list" &&
        (!roomId || roomId.includes("/") || roomId === "." || roomId === ".."))
    )
      return;
    let isSubscribed = true;
    const queryKey =
      scope === "list"
        ? chatQueryKeys.list(userId)
        : scope === "detail"
          ? chatQueryKeys.detail(roomId, userId)
          : chatQueryKeys.messages(roomId, userId);
    const unsubscribe = subscribeToChatChanges(
      userId,
      scope,
      roomId,
      () => {
        if (!isSubscribed) return;
        setFailure(null);
        void queryClient.invalidateQueries({ queryKey, exact: true });
      },
      (error) => {
        if (isSubscribed) setFailure({ key, error });
      },
    );
    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [userId, scope, roomId, key, revision, queryClient]);

  return { error: failure?.key === key ? failure.error : null, restart };
}
