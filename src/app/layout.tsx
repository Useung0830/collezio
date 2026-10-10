import type { Metadata } from "next";

import Toast from "@/components/common/Toast";
import QueryProvider from "@/components/QueryProvider";
import AuthQueryCleanup from "@/features/auth/components/AuthQueryCleanup";

import { getSiteUrl } from "@/lib/getSiteUrl";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Collezio — 소중한 컬렉션을 교환으로 연결하다",
    template: "%s | Collezio",
  },
  description:
    "피규어, 카드, 굿즈까지. 콜레지오에서 소장품을 발견하고 교환하며 수집 이야기를 나눠보세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="text-body-16 text-black-900 bg-[#fdfdfd]">
        <QueryProvider>
          <AuthQueryCleanup />
          {children}
        </QueryProvider>
        <Toast />
      </body>
    </html>
  );
}
