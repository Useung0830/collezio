import RequireAuth from "@/features/auth/components/RequireAuth";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
