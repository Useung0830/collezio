import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mt-6 px-3 lg:mt-12 lg:px-4">{children}</main>
      <Footer />
    </>
  );
}
