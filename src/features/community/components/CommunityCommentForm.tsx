"use client";

import { useRef, useState } from "react";

import Button from "@/components/common/button/Button";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";

type CommunityCommentFormProps = {
  initialContent?: string;
  onSubmit: (content: string, requestId: string) => Promise<void>;
  onCancel?: () => void;
};

export default function CommunityCommentForm({
  initialContent = "",
  onSubmit,
  onCancel,
}: CommunityCommentFormProps) {
  const requestId = useRef<string | null>(null);
  const isSubmitting = useRef(false);
  const [content, setContent] = useState(initialContent);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;
    if (!content.trim() || content.trim().length > 1000) {
      setError("댓글은 1~1,000자로 입력해주세요.");
      return;
    }
    isSubmitting.current = true;
    setIsBusy(true);
    setError("");
    setNotice("");
    requestId.current ??= crypto.randomUUID();
    try {
      await onSubmit(content, requestId.current);
      requestId.current = null;
      setContent("");
      setNotice("댓글을 저장했습니다.");
    } catch (error) {
      setError(
        error instanceof CommunityPostSaveError
          ? error.message
          : "댓글을 저장하지 못했습니다. 입력 내용은 유지됩니다. 연결 상태를 확인하고 다시 시도해주세요.",
      );
    } finally {
      isSubmitting.current = false;
      setIsBusy(false);
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      aria-label={onCancel ? "댓글 수정" : "댓글 작성"}
      aria-busy={isBusy}
      className="mt-4"
    >
      <div className="flex gap-2">
        <textarea
          aria-label={onCancel ? "수정할 댓글 내용" : "댓글 내용"}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          maxLength={1000}
          disabled={isBusy}
          rows={2}
          placeholder="댓글을 입력해주세요."
          className="border-black-300 text-body-14 text-black-900 min-w-0 flex-1 resize-none rounded-xl border px-4 py-3"
        />
        <Button
          type="submit"
          disabled={isBusy || !content.trim()}
          isLoading={isBusy}
        >
          {onCancel ? "댓글 수정 완료" : "댓글 등록"}
        </Button>
      </div>
      {onCancel && (
        <Button
          type="button"
          disabled={isBusy}
          onClick={onCancel}
          className="mt-2"
        >
          댓글 수정 취소
        </Button>
      )}
      {error && (
        <p role="alert" className="text-body-14 text-black-900 mt-2">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-body-14 text-black-900 mt-2">
          {notice}
        </p>
      )}
    </form>
  );
}
