"use client";

import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";
import { toast } from "react-toastify/unstyled";

import Button from "@/components/common/button/Button";
import ProfileImageField from "@/features/user/components/ProfileImageField";
import { useProfileEditDialog } from "@/features/user/hooks/useProfileEditDialog";
import { useUpdateProfileMutation } from "@/features/user/hooks/useUpdateProfileMutation";
import type { PublicProfile } from "@/features/user/types/profile";
import { validateProfileNickname } from "@/features/user/utils/validateProfile";

type ProfileEditModalProps = {
  profile: PublicProfile;
  onClose: () => void;
};

export default function ProfileEditModal({
  profile,
  onClose,
}: ProfileEditModalProps) {
  const titleId = useId();
  const mutation = useUpdateProfileMutation();
  const submittingRef = useRef(false);
  const { dialogRef, handleCancel } = useProfileEditDialog(
    mutation.isPending,
    onClose,
  );
  const [nickname, setNickname] = useState(profile.nickname);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const hasChanges = nickname.trim() !== profile.nickname || image !== null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || !hasChanges) return;
    submittingRef.current = true;
    setError("");
    try {
      const value = validateProfileNickname(nickname);
      await mutation.mutateAsync({
        userId: profile.id,
        nickname: value,
        image,
      });
      toast.success("프로필이 수정되었습니다.");
      onClose();
    } catch (error) {
      setError(
        error instanceof Error && !("code" in error)
          ? error.message
          : "프로필을 저장하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.",
      );
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={mutation.isPending}
      onCancel={handleCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
      className="text-black-900 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-110 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 id={titleId} className="text-heading-20">
        프로필 수정
      </h2>
      <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <ProfileImageField
          imageUrl={profile.imageUrl}
          nickname={nickname}
          disabled={mutation.isPending}
          onChange={setImage}
        />
        <label className="text-label-14 flex flex-col gap-2">
          닉네임
          <input
            value={nickname}
            onChange={(event) => setNickname(event.currentTarget.value)}
            disabled={mutation.isPending}
            required
            minLength={2}
            maxLength={10}
            autoComplete="nickname"
            className="border-black-300 text-body-16 rounded-xl border p-3"
          />
          <span className="text-caption-12">2~10자로 입력해주세요.</span>
        </label>
        {error && (
          <p role="alert" className="text-body-14 text-red-500">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button disabled={mutation.isPending} onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!hasChanges || mutation.isPending}
            isLoading={mutation.isPending}
          >
            {mutation.isPending ? "저장 중" : "저장"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
