"use client";

import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTradeReview } from "@/features/chat/api/createTradeReview";
import ChatActionDialog from "@/features/chat/components/ChatActionDialog";

interface TradeReviewDialogProps {
  roomId: string;
  userId: string;
  proposalId: string;
  onClose: () => void;
}

export default function TradeReviewDialog({
  roomId,
  userId,
  proposalId,
  onClose,
}: TradeReviewDialogProps) {
  const client = useQueryClient();
  const contentId = useId();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createTradeReview(roomId, userId, proposalId, { rating, content }),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ["chat", "completion", roomId, userId, proposalId],
      });
      onClose();
    },
  });
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mutation.isPending) mutation.mutate();
  };
  return (
    <ChatActionDialog
      title="상대방에게 후기 남기기"
      isPending={mutation.isPending}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="text-body-14 mt-4 flex flex-col gap-4"
      >
        <p>
          두 분 모두 작성해야 평점과 후기가 서로에게 공개돼요. 제출한 후기는
          수정하거나 삭제할 수 없어요.
        </p>
        <fieldset disabled={mutation.isPending}>
          <legend className="text-label-14 mb-2">거래는 어떠셨나요?</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 ${rating === value ? "border-brand-blue bg-black-50" : "border-black-200"}`}
              >
                <input
                  type="radio"
                  name="trade-rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  required
                />
                <span>{value}점</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <label htmlFor={contentId} className="text-label-14">
            거래 후기
          </label>
          <textarea
            id={contentId}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1000}
            required
            disabled={mutation.isPending}
            rows={5}
            placeholder="상대방과의 거래 경험을 남겨주세요."
            className="border-black-200 w-full resize-none rounded-lg border p-3"
          />
          <p className="text-caption-12 text-right">{content.length} / 1,000</p>
        </div>
        {mutation.isError && (
          <p role="alert">
            {mutation.error.message ||
              "후기를 저장하지 못했습니다. 다시 시도해주세요."}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 rounded-lg border p-3 disabled:opacity-50"
          >
            닫기
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !rating || !content.trim()}
            className="bg-brand-blue flex-1 rounded-lg p-3 text-white disabled:opacity-50"
          >
            {mutation.isPending ? "저장 중…" : "후기 제출"}
          </button>
        </div>
      </form>
    </ChatActionDialog>
  );
}
