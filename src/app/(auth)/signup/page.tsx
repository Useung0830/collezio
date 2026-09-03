import Link from "next/link";

import EmailIcon from "@/assets/icons/icon-email.svg";
import VisibilityIcon from "@/assets/icons/icon-eye-thin.svg";
import PasswordIcon from "@/assets/icons/icon-lock.svg";
import ProfileIcon from "@/assets/icons/icon-profile.svg";
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
          <form className="flex flex-col gap-6">
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
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  className="text-body-16 w-full outline-none"
                />
                <VisibilityIcon className="size-6" />
              </div>
              <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
                <PasswordIcon className="size-6" />
                <input
                  id="confirmpassword"
                  type="password"
                  placeholder="비밀번호 확인"
                  className="text-body-16 w-full outline-none"
                />
                <VisibilityIcon className="size-6" />
              </div>
              <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
                <ProfileIcon className="size-6" />
                <input
                  type="text"
                  placeholder="닉네임"
                  className="text-body-16 text-black-900 w-full outline-none"
                />
              </div>
            </div>
            <div className="text-body-14 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <p>이용약관에 동의합니다.</p>
                </div>
                <span className="bg-black-100 border-black-200 rounded-sm border px-2 py-1">
                  보기
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  <p>개인정보처리방침에 동의합니다.</p>
                </div>
                <span className="bg-black-100 border-black-200 rounded-sm border px-2 py-1">
                  보기
                </span>
              </div>
            </div>

            <button className="bg-brand-green w-full rounded-lg py-3 text-white">
              회원가입
            </button>
          </form>
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
