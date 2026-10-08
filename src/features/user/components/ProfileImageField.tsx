import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/common/button/Button";
import ProfileAvatar from "@/features/user/components/ProfileAvatar";
import { validateProfileImage } from "@/features/user/utils/validateProfile";

type ProfileImageFieldProps = {
  imageUrl: string | null;
  nickname: string;
  disabled: boolean;
  onChange: (file: File) => void;
};

export default function ProfileImageField({
  imageUrl,
  nickname,
  disabled,
  onChange,
}: ProfileImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      validateProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFileName(file.name);
      setError("");
      onChange(file);
    } catch (error) {
      setError(error instanceof Error ? error.message : "사진을 확인해주세요.");
    }
  };

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  return (
    <div className="flex flex-col gap-3">
      <ProfileAvatar imageUrl={previewUrl ?? imageUrl} nickname={nickname} />
      <div className="flex min-w-0 items-center gap-3">
        <Button
          size="compact"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          사진 변경
        </Button>
        {fileName && (
          <span className="text-caption-12 min-w-0 truncate">{fileName}</span>
        )}
        <input
          ref={inputRef}
          type="file"
          aria-label="프로필 사진"
          tabIndex={-1}
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
        />
      </div>
      <p className="text-caption-12">JPG, PNG, WebP · 최대 5MB</p>
      {error && (
        <p role="alert" className="text-body-14 text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
