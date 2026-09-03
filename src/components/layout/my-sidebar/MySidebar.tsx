"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutConfirmModal from "@/features/auth/components/LogoutConfirmModal";
import WithdrawalModal from "@/features/auth/components/WithdrawalModal";

const exchangeMenus = [
  { label: "보유품 목록", href: "/collections" },
  { label: "매칭 내역", href: "/matches" },
];

const userMenus = [
  { label: "찜한 컬렉션", href: "/favorites" },
  { label: "거래 후기", href: "/reviews" },
  { label: "내가 쓴 글", href: "/posts" },
];

export default function MySidebar() {
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const handleOpenLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleOpenWithdrawalModal = () => {
    setIsWithdrawalModalOpen(true);
  };

  const handleCloseWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false);
  };

  const handleWithdrawal = () => {
    setIsWithdrawalModalOpen(false);
  };

  const getMenuColor = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
      ? "text-black-900"
      : "text-black-600";

  return (
    <>
      <aside className="border-black-200 text-label-14 hidden w-41.75 shrink-0 flex-col gap-5 rounded-2xl border pt-8 pr-12 pb-59 pl-6 whitespace-nowrap lg:flex">
        <div className="flex flex-col gap-5">
          <h2 className="text-heading-20 text-black-900">교환 정보</h2>
          <ul className="flex flex-col gap-3">
            {exchangeMenus.map((menu) => (
              <li key={menu.href}>
                <Link href={menu.href} className={getMenuColor(menu.href)}>
                  {menu.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-black-200 w-full border" />
        <div className="flex flex-col gap-5">
          <h2 className="text-heading-20 text-black-900">내 정보</h2>
          <ul className="flex flex-col gap-3">
            {userMenus.map((menu) => (
              <li key={menu.href}>
                <Link href={menu.href} className={getMenuColor(menu.href)}>
                  {menu.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="text-black-600"
                onClick={handleOpenLogoutModal}
              >
                로그아웃
              </button>
            </li>
            <li>
              <button
                type="button"
                className="text-black-600"
                onClick={handleOpenWithdrawalModal}
              >
                탈퇴하기
              </button>
            </li>
          </ul>
        </div>
      </aside>
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onCancel={handleCloseLogoutModal}
        onConfirm={handleLogout}
      />
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={handleCloseWithdrawalModal}
        onConfirm={handleWithdrawal}
      />
    </>
  );
}
