import { FirebaseError } from "firebase/app";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";

type ProductLoadErrorProps = {
  error: Error;
  message: string;
  onRetry: () => void;
  title?: string;
};

export default function ProductLoadError({
  error,
  message,
  onRetry,
  title,
}: ProductLoadErrorProps) {
  const isPermissionDenied =
    error instanceof FirebaseError && error.code === "permission-denied";

  return (
    <section className="text-black-900 flex flex-col items-start gap-3">
      {title && <h2 className="text-heading-24">{title}</h2>}
      <p role="alert" className="text-body-16">
        {isPermissionDenied
          ? "상품을 볼 권한이 없습니다. 로그인 상태를 확인해주세요."
          : message}
      </p>
      <Button onClick={onRetry}>다시 시도</Button>
      {isPermissionDenied && <LinkButton href="/login">로그인</LinkButton>}
    </section>
  );
}
