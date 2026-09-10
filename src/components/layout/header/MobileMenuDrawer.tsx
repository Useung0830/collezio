"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";
import LinkButton from "@/components/common/button/LinkButton";
import LogoutConfirmModal from "@/features/auth/components/LogoutConfirmModal";
import WithdrawalModal from "@/features/auth/components/WithdrawalModal";

import CloseIcon from "@/assets/icons/icon-close.svg";
import RightIcon from "@/assets/icons/icon-right.svg";
import profileImage from "@/assets/images/profile.png";

type MobileMenuDrawerProps = {
  isLoggedIn: boolean;
  isOpen: boolean;
  onClose: () => void;
};

const exchangeMenus = [
  { label: "보유품 목록", href: "/collections" },
  { label: "매칭 내역", href: "/matches" },
];

const userMenus = [
  { label: "찜한 컬렉션", href: "/favorites" },
  { label: "거래 후기", href: "/reviews" },
  { label: "내가 쓴 글", href: "/posts" },
];

export default function MobileMenuDrawer({
  isLoggedIn,
  isOpen,
  onClose,
}: MobileMenuDrawerProps) {
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const handleToggleExchange = () => {
    setIsExchangeOpen((isOpen) => !isOpen);
  };

  const handleToggleUserMenu = () => {
    setIsUserMenuOpen((isOpen) => !isOpen);
  };

  const handleOpenLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    onClose();
  };

  const handleOpenWithdrawalModal = () => {
    setIsWithdrawalModalOpen(true);
  };

  const handleCloseWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false);
  };

  const handleWithdrawal = () => {
    setIsWithdrawalModalOpen(false);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      inert={!isOpen}
    >
      <button
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="메뉴 닫기"
        onClick={onClose}
      />
      <aside
        aria-label="전체 메뉴"
        className={`border-black-200 absolute top-0 right-0 h-full w-65 border-l bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-black-200 flex min-h-14 items-center justify-between border-b px-4">
          {isLoggedIn ? (
            <Link
              href="/collections"
              className="flex min-w-0 items-center gap-2"
              onClick={onClose}
            >
              <Image
                src={profileImage}
                alt="컬렉션 모아모아 프로필"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-label-14 text-black-900 truncate">
                컬렉션 모아모아
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <LinkButton
                href="/login"
                size="xs"
                shape="square"
                variant="outline"
                onClick={onClose}
              >
                로그인
              </LinkButton>
              <LinkButton
                href="/signup"
                size="xs"
                shape="square"
                variant="blue"
                onClick={onClose}
              >
                회원가입
              </LinkButton>
            </div>
          )}
          <IconButton size="sm" aria-label="메뉴 닫기" onClick={onClose}>
            <CloseIcon className="text-black-900 size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <nav className="text-body-16 text-black-900 flex flex-col gap-5 px-6 pt-5">
          <Link href="/chat" onClick={onClose}>
            채팅
          </Link>
          <Link href="/community" onClick={onClose}>
            커뮤니티
          </Link>

          <MenuGroup
            label="교환 정보"
            isOpen={isExchangeOpen}
            onToggle={handleToggleExchange}
            menus={exchangeMenus}
            onClose={onClose}
          />
          <MenuGroup
            label="내 정보"
            isOpen={isUserMenuOpen}
            onToggle={handleToggleUserMenu}
            menus={userMenus}
            onClose={onClose}
          />

          {isLoggedIn && (
            <div className="text-black-600 flex flex-col gap-5">
              <Button
                variant="muted"
                size="text"
                className="self-start"
                onClick={handleOpenLogoutModal}
              >
                로그아웃
              </Button>
              <Button
                variant="muted"
                size="text"
                className="self-start"
                onClick={handleOpenWithdrawalModal}
              >
                탈퇴하기
              </Button>
            </div>
          )}
        </nav>
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
    </div>
  );
}

type MenuGroupProps = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  menus: { label: string; href: string }[];
  onClose: () => void;
};

function MenuGroup({
  label,
  isOpen,
  onToggle,
  menus,
  onClose,
}: MenuGroupProps) {
  return (
    <div className="flex flex-col gap-5">
      <button
        className="flex items-center justify-between text-left"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{label}</span>
        <RightIcon
          className={`size-5 transition-transform ${isOpen ? "-rotate-90" : "rotate-90"}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="text-body-14 text-black-600 flex flex-col gap-5 pl-6">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href} onClick={onClose}>
              {menu.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
