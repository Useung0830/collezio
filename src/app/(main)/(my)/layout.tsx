import type { Metadata } from "next";

import MySidebar from "@/components/layout/my-sidebar/MySidebar";
import RequireAuth from "@/features/auth/components/RequireAuth";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="mx-auto flex w-full max-w-280 gap-6">
        <MySidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </RequireAuth>
  );
}
