"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import Button from "@/components/common/button/Button";
import ImageUploader from "@/components/common/ImageUploader";
import { useUpdateCommunityPostMutation } from "@/features/community/hooks/useUpdateCommunityPostMutation";
import type { CommunityPostDocument } from "@/features/community/types/communityDocument";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";
import { getCommunityImageUrl } from "@/features/community/utils/getCommunityImageUrl";
import {
  COMMUNITY_IMAGE_TYPES,
  MAX_COMMUNITY_IMAGE_COUNT,
  validateCommunityImages,
} from "@/features/community/utils/validateCommunityImages";
import { validateCommunityPost } from "@/features/community/utils/validateCommunityPost";

type EditCommunityPostFormProps = {
  post: CommunityPostDocument;
  onCancel: () => void;
  onSaved: (isCleaned: boolean) => void;
};

export default function EditCommunityPostForm({
  post,
  onCancel,
  onSaved,
}: EditCommunityPostFormProps) {
  const mutation = useUpdateCommunityPostMutation();
  const isSubmitting = useRef(false);
  const [retainedPaths, setRetainedPaths] = useState(
    post.images.map((image) => image.path),
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;
    const data = new FormData(event.currentTarget);
    const input = {
      title: String(data.get("title") ?? ""),
      content: String(data.get("content") ?? ""),
    };
    try {
      validateCommunityPost(input);
      validateCommunityImages(files);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "입력값을 확인해주세요.",
      );
      return;
    }
    isSubmitting.current = true;
    setError("");
    try {
      const result = await mutation.mutateAsync({
        postId: post.id,
        userId: post.authorId,
        version: post.version,
        retainedPaths,
        files,
        ...input,
      });
      onSaved(result.isCleaned);
    } catch (error) {
      setError(
        error instanceof CommunityPostSaveError
          ? error.message
          : "수정하지 못했습니다. 입력 내용과 연결 상태를 확인해주세요.",
      );
    } finally {
      isSubmitting.current = false;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="게시글 수정"
      aria-busy={mutation.isPending}
      className="text-black-900 space-y-5"
    >
      <h1 className="text-heading-24">게시글 수정</h1>
      <fieldset disabled={mutation.isPending} className="space-y-5">
        <input
          name="title"
          aria-label="게시글 제목"
          defaultValue={post.title}
          required
          maxLength={100}
          className="text-heading-20 border-black-200 w-full rounded-xl border p-3"
        />
        <textarea
          name="content"
          aria-label="게시글 내용"
          defaultValue={post.content}
          required
          maxLength={5000}
          className="text-body-16 border-black-200 min-h-60 w-full rounded-xl border p-3"
        />
        <div className="flex flex-wrap gap-4">
          {post.images
            .filter((image) => retainedPaths.includes(image.path))
            .map((image, index) => (
              <div key={image.path} className="w-24">
                <Image
                  src={getCommunityImageUrl(image.url)}
                  alt={`기존 사진 ${index + 1}`}
                  width={96}
                  height={96}
                  unoptimized={
                    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
                  }
                  className="size-24 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRetainedPaths((paths) =>
                      paths.filter((path) => path !== image.path),
                    )
                  }
                  className="text-body-14 mt-2"
                  aria-label={`기존 사진 ${index + 1} 제거`}
                >
                  사진 제거
                </button>
              </div>
            ))}
        </div>
        <ImageUploader
          triggerVariant="text"
          disabled={mutation.isPending}
          maxImageCount={MAX_COMMUNITY_IMAGE_COUNT - retainedPaths.length}
          accept={COMMUNITY_IMAGE_TYPES.join(",")}
          onFilesChange={setFiles}
          validateFiles={(selected) => {
            validateCommunityImages(selected);
            if (
              retainedPaths.length + selected.length >
              MAX_COMMUNITY_IMAGE_COUNT
            )
              throw new Error(
                "기존 사진과 새 사진을 합쳐 최대 10장까지 첨부할 수 있습니다.",
              );
          }}
        />
        <p className="text-caption-12 text-black-600">
          사진은 저장할 때 반영됩니다. JPG, PNG, WebP · 장당 5MB 이하 · 총 10장
        </p>
        <div className="flex gap-3">
          <Button type="button" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            수정 완료
          </Button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-body-14">
          {error}
        </p>
      )}
      {mutation.isPaused && (
        <p role="status" className="text-body-14">
          인터넷 연결을 기다리고 있습니다.
        </p>
      )}
    </form>
  );
}
