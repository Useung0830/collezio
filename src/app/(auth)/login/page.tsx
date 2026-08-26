import Link from "next/link";

import EmailIcon from "@/assets/icons/icon_email.svg";
import VisibilityIcon from "@/assets/icons/icon_eye-thin.svg";
import GooleLogoIcon from "@/assets/icons/icon_google-logo.svg";
import KakaoLogoIcon from "@/assets/icons/icon_kakao-logo.svg";
import PasswordIcon from "@/assets/icons/icon_lock.svg";
import LogoGnb from "@/assets/images/logo_gnb.svg";

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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
              <EmailIcon className="size-6" />
              <input
                type="email"
                placeholder="이메일"
                className="text-body-16 text-black-900 w-full outline-none"
              />
            </div>
            <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
              <PasswordIcon className="size-6" />
              <input
                type="password"
                placeholder="비밀번호"
                className="text-body-16 w-full outline-none"
              />
              <VisibilityIcon className="size-6" />
            </div>
          </div>
          <button className="bg-brand-green w-full rounded-lg py-3 text-white">
            로그인
          </button>
        </div>
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
          <div className="border-black-200 relative flex items-center justify-center rounded-lg border px-3 py-3">
            <KakaoLogoIcon className="absolute left-5 size-4" />
            <span className="text-body-16 text-black-900">카카오로 계속</span>
          </div>
          <div className="border-black-200 relative flex items-center justify-center rounded-lg border px-3 py-3">
            <GooleLogoIcon className="absolute left-5 size-4" />
            <span className="text-body-16 text-black-900">Google로 계속</span>
          </div>
        </div>
      </div>
    </main>
  );
}
