import Link from "next/link";

import Button from "@/components/common/button/Button";
import LoginForm from "@/components/LoginForm";

import GooleLogoIcon from "@/assets/icons/icon-google-logo.svg";
import KakaoLogoIcon from "@/assets/icons/icon-kakao-logo.svg";
import LogoGnb from "@/assets/images/logo-gnb.svg";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center py-20">
      <Link href="/">
        <LogoGnb
          className="mb-10 h-11 w-auto lg:h-13"
          aria-label="콜레지오 로고"
        />
      </Link>
      <div className="border-black-200 flex w-full max-w-137 flex-col justify-center gap-4 rounded-2xl p-3 pt-0 lg:px-17.75">
        <LoginForm />
        <div className="text-body-14 flex items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <p className="text-black-700">계정이 없으신가요?</p>
            <Link href="/signup">
              <span className="text-brand-green">회원가입</span>
            </Link>
          </div>
          <div className="border-black-200 h-2 border-l" />
          <Link href="/find-password">
            <span>비밀번호 찾기</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="border-black-200 w-full border-t" />
          <span className="text-body-14 text-black-400 whitespace-nowrap">
            또는
          </span>
          <div className="border-black-200 w-full border-t" />
        </div>
        <div className="flex flex-col gap-2">
          <Button shape="square" className="relative">
            <KakaoLogoIcon className="absolute left-5 size-4" />
            <span className="text-body-16 text-black-900">카카오로 계속</span>
          </Button>
          <Button shape="square" className="relative">
            <GooleLogoIcon className="absolute left-5 size-4" />
            <span className="text-body-16 text-black-900">Google로 계속</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
