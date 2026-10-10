import type { Metadata } from "next";

import RequireAuth from "@/features/auth/components/RequireAuth";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
