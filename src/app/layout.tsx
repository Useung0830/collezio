import "./globals.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="text-body-16 text-black-900 bg-[#fdfdfd]">
        {children}
      </body>
    </html>
  );
}
