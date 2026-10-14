import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main>
      <h1>상품을 찾을 수 없습니다.</h1>
      <Link href="/">홈으로 돌아가기</Link>
    </main>
  );
}
