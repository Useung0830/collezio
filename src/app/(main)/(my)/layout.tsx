import MySidebar from "@/components/layout/my-sidebar/MySidebar";

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-280 gap-6">
      <MySidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
