import { signOut } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

export async function logoutAccount() {
  await signOut(firebaseAuth);
}
