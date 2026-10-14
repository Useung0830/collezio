import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

export function useProfileUserId() {
  const [userId, setUserId] = useState<string | null>();
  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => {
        setUserId(user?.uid ?? null);
      }),
    [],
  );
  return userId;
}
