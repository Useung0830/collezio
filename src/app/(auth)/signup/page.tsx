import Link from "next/link";

import SignupForm from "@/features/auth/components/SignupForm";

import LogoGnb from "@/assets/images/logo-gnb.svg";

export default function SignupPage() {
  return (
    <main className="flex flex-col items-center justify-center py-20">
      <Link href="/">
        <LogoGnb
          className="mb-10 h-11 w-auto lg:h-13"
          aria-label="콜레지오 로고"
        />
      </Link>
      <div className="flex w-full max-w-137 flex-col justify-center gap-4 rounded-2xl p-3 pt-0 lg:px-17.75">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-heading-24 text-black-900">회원가입</h1>
            <p className="text-body-16 text-black-900">
              내 컬렉션의 새로운 가치를 만나보세요.
            </p>
          </div>
          <SignupForm />
        </div>
        <div className="text-body-14 flex items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <p className="text-black-700">이미 계정이 있으신가요?</p>
            <Link href="/login">
              <span className="text-brand-green">로그인</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
