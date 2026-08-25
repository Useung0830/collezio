import "./globals.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="bg-[#fdfdfd]">{children}</body>
    </html>
  );
}
