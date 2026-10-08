import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDocFromServer, onSnapshot } from "firebase/firestore";

import {
  parseTradeCompletion,
  parseTradeReview,
} from "@/features/chat/utils/parseTradeCompletion";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export function useTradeCompletion(
  roomId: string,
  userId: string,
  proposalId: string | null,
) {
  const client = useQueryClient();
  useEffect(() => {
    if (!proposalId) return;
    const queryKey = ["chat", "completion", roomId, userId, proposalId];
    return onSnapshot(
      doc(firebaseDb, "chatRooms", roomId, "completions", proposalId),
      () => {
        void client.invalidateQueries({ queryKey });
      },
      () => {
        void client.invalidateQueries({ queryKey });
      },
    );
  }, [client, roomId, userId, proposalId]);
  return useQuery({
    queryKey: ["chat", "completion", roomId, userId, proposalId],
    enabled: !!proposalId,
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      validateFirebaseUser(userId);
      if (!proposalId) throw new Error("확정된 거래가 없습니다.");
      const reference = doc(
        firebaseDb,
        "chatRooms",
        roomId,
        "completions",
        proposalId,
      );
      const completion = parseTradeCompletion(
        (await getDocFromServer(reference)).data(),
      );
      // 상대방 후기는 상호 제출 확인 후에만 요청합니다. 보안 규칙도 같은 조건을 강제합니다.
      const partnerId =
        completion.reviewedBy.length === 2
          ? completion.reviewedBy.find((id) => id !== userId)
          : null;
      const partnerSnapshot = partnerId
        ? await getDocFromServer(doc(reference, "reviews", partnerId))
        : null;
      validateFirebaseUser(userId);
      return {
        ...completion,
        partnerReview: partnerSnapshot?.exists()
          ? parseTradeReview(partnerSnapshot.data())
          : null,
      };
    },
  });
}
