import Link from "next/link";

import EmailIcon from "@/assets/icons/icon-email.svg";
import LogoGnb from "@/assets/images/logo-gnb.svg";

export default function FindPasswordPage() {
  return (
    <main className="flex flex-col items-center justify-center py-20">
      <Link href="/">
        <LogoGnb
          className="mb-10 h-11 w-auto lg:h-13"
          aria-label="콜레지오 로고"
        />
      </Link>
      <div className="flex w-full max-w-137 flex-col justify-center gap-4 rounded-2xl p-3 pt-0 lg:px-17.75">
        <div className="text-black-900 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-heading-24 text-black-900">비밀번호 찾기</h1>
            <p className="text-body-16 text-black-900">
              이메일을 입력해주세요.
            </p>
          </div>
          <form className="flex flex-col gap-6">
            <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
              <EmailIcon className="size-6" />
              <input
                type="email"
                placeholder="이메일"
                className="text-body-16 text-black-900 w-full outline-none"
              />
            </div>
            <button className="bg-brand-green w-full rounded-lg py-3 text-white">
              재설정 링크 받기
            </button>
          </form>
        </div>
        <div className="text-body-14 flex items-center justify-center gap-2">
          <p className="text-black-700">비밀번호가 기억나시나요?</p>
          <Link href="/login">
            <span className="text-brand-green">로그인</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
