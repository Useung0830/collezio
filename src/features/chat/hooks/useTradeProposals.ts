import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import type {
  TradeProposal,
  TradeState,
} from "@/features/chat/types/tradeProposal";
import { validateTradeTerms } from "@/features/chat/utils/validateTradeTerms";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export function useTradeProposals(roomId: string, userId: string) {
  const client = useQueryClient();
  useEffect(
    () =>
      onSnapshot(
        collection(firebaseDb, "chatRooms", roomId, "proposals"),
        () => {
          void client.invalidateQueries({
            queryKey: ["chat", "proposals", roomId, userId],
          });
          void client.invalidateQueries({ queryKey: ["products"] });
        },
        () => {
          void client.invalidateQueries({
            queryKey: ["chat", "proposals", roomId, userId],
          });
        },
      ),
    [client, roomId, userId],
  );
  return useQuery({
    queryKey: ["chat", "proposals", roomId, userId],
    queryFn: async () => {
      validateFirebaseUser(userId);
      const [items, state] = await Promise.all([
        getDocs(collection(firebaseDb, "chatRooms", roomId, "proposals")),
        getDoc(doc(firebaseDb, "chatRooms", roomId, "trade", "state")),
      ]);
      validateFirebaseUser(userId);
      const proposals = items.docs.map((item): TradeProposal => {
        const data = item.data();
        if (
          ![
            "pending",
            "accepted",
            "rejected",
            "withdrawn",
            "superseded",
          ].includes(data.status) ||
          typeof data.senderId !== "string" ||
          typeof data.recipientId !== "string" ||
          typeof data.productId !== "string" ||
          (data.previousId !== null && typeof data.previousId !== "string")
        )
          throw new Error("거래 제안을 확인할 수 없습니다.");
        const terms = validateTradeTerms(
          data.terms,
          data.terms.scheduledAt - 1,
        );
        return {
          id: item.id,
          senderId: data.senderId,
          recipientId: data.recipientId,
          productId: data.productId,
          previousId: data.previousId,
          status: data.status,
          terms,
        };
      });
      const value = state.data() ?? { pendingId: null, acceptedId: null };
      if (
        ![value.pendingId, value.acceptedId].every(
          (id) => id === null || typeof id === "string",
        )
      )
        throw new Error("거래 상태를 확인할 수 없습니다.");
      return { proposals, state: value as TradeState };
    },
  });
}
