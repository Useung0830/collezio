"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";
import LinkButton from "@/components/common/button/LinkButton";
import ImageUploader from "@/components/common/ImageUploader";
import { useCommunityAuthorId } from "@/features/community/hooks/useCommunityAuthorId";
import { useCreateCommunityPostMutation } from "@/features/community/hooks/useCreateCommunityPostMutation";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";
import {
  COMMUNITY_IMAGE_TYPES,
  MAX_COMMUNITY_IMAGE_COUNT,
  validateCommunityImages,
} from "@/features/community/utils/validateCommunityImages";
import { validateCommunityPost } from "@/features/community/utils/validateCommunityPost";

import CloseIcon from "@/assets/icons/icon-close.svg";
export default function NewCommunityPostForm() {
  const router = useRouter();
  const userId = useCommunityAuthorId();
  const mutation = useCreateCommunityPostMutation();
  const isSubmitting = useRef(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const isBusy = mutation.isPending || mutation.isSuccess;
  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || isSubmitting.current) return;
    const formData = new FormData(event.currentTarget);
    let input;
    try {
      validateCommunityImages(files);
      input = validateCommunityPost({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "입력값을 확인해주세요.",
      );
      return;
    }
    isSubmitting.current = true;
    setError("");
    try {
      const postId = await mutation.mutateAsync({ ...input, files });
      router.replace(`/community/${postId}`);
    } catch (error) {
      isSubmitting.current = false;
      setError(
        error instanceof CommunityPostSaveError
          ? error.message
          : "게시글을 저장하지 못했습니다. 로그인과 연결 상태를 확인한 뒤 다시 시도해주세요.",
      );
    }
  };
  return (
    <section className="text-black-900 mx-auto w-full max-w-184 pb-12">
      <div className="flex items-center gap-2">
        <IconButton
          size="sm"
          aria-label="글쓰기 닫기"
          disabled={isBusy}
          onClick={() => router.back()}
        >
          <CloseIcon className="size-5" aria-hidden="true" />
        </IconButton>
        <h1 className="text-heading-24">글쓰기</h1>
      </div>
      {userId === undefined ? (
        <p role="status" className="text-body-16 mt-6">
          로그인 상태를 확인하고 있습니다.
        </p>
      ) : userId === null ? (
        <div className="mt-6">
          <p className="text-body-16 mb-4">
            로그인 후 게시글을 작성할 수 있습니다.
          </p>
          <LinkButton href="/login">로그인</LinkButton>
        </div>
      ) : (
        <form
          className="mt-6 flex min-h-[calc(100vh-13rem)] flex-col"
          onSubmit={handleSubmit}
          aria-busy={isBusy}
        >
          <input
            name="title"
            type="text"
            required
            maxLength={100}
            disabled={isBusy}
            placeholder="제목을 입력하세요."
            aria-label="게시글 제목"
            className="text-heading-20 placeholder:text-black-500 w-full outline-none"
          />
          <textarea
            name="content"
            required
            maxLength={5000}
            disabled={isBusy}
            placeholder="자유롭게 이야기를 나눠보세요."
            aria-label="게시글 내용"
            className="text-body-16 placeholder:text-black-500 mt-2 min-h-80 w-full flex-1 resize-none outline-none"
          />
          <div className="mt-6">
            <ImageUploader
              triggerVariant="text"
              maxImageCount={MAX_COMMUNITY_IMAGE_COUNT}
              disabled={isBusy}
              accept={COMMUNITY_IMAGE_TYPES.join(",")}
              validateFiles={validateCommunityImages}
              onFilesChange={setFiles}
            />
            <p className="text-caption-12 text-black-600 mt-2">
              JPG, PNG, WebP · 장당 5MB 이하 · 최대 10장
            </p>
          </div>
          {error && (
            <p role="alert" className="text-body-14 mt-4">
              {error}
            </p>
          )}
          {mutation.isPaused && (
            <p role="status" className="text-body-14 mt-4">
              인터넷 연결을 기다리고 있습니다.
            </p>
          )}
          <Button
            type="submit"
            shape="rounded"
            disabled={isBusy}
            isLoading={mutation.isPending}
            className="mt-5 h-13 w-full"
          >
            {isBusy ? "저장 중…" : "작성 완료"}
          </Button>
        </form>
      )}
    </section>
  );
}
