"use client";

import { useState } from "react";

import type { CommunityComment } from "@/features/community/types/communityPost";

import GoodIcon from "@/assets/icons/icon-good.svg";

type CommunityPostEngagementProps = {
  initialComments: CommunityComment[];
  initialLikeCount: number;
  postId: number;
};

export default function CommunityPostEngagement({
  initialComments,
  initialLikeCount,
  postId,
}: CommunityPostEngagementProps) {
  const [comments, setComments] = useState(initialComments);
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  const likeCount = initialLikeCount + (isLiked ? 1 : 0);

  const handleLikeToggle = () => {
    setIsLiked((isSelected) => !isSelected);
  };

  const handleCommentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setComment(event.target.value);
  };

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      return;
    }

    setComments((currentComments) => [
      ...currentComments,
      {
        id: Date.now(),
        postId,
        author: "컬렉션 모아모아",
        content: trimmedComment,
        createdAt: "방금 전",
      },
    ]);
    setComment("");
  };

  return (
    <>
      <div className="border-black-200 flex justify-start border-b py-8">
        <button
          type="button"
          aria-pressed={isLiked}
          className={`text-label-14 flex min-w-28 items-center justify-center gap-2 rounded-full border px-5 py-3 ${
            isLiked
              ? "border-brand-green bg-brand-green text-white"
              : "border-black-300 text-black-900 bg-white"
          }`}
          onClick={handleLikeToggle}
        >
          <GoodIcon className="size-4" aria-hidden="true" />
          좋아요 {likeCount}
        </button>
      </div>

      <section className="mt-8" aria-labelledby="comments-title">
        <h2 id="comments-title" className="text-heading-20 text-black-900">
          댓글 <span className="text-black-600 ml-1">{comments.length}</span>
        </h2>

        <form className="mt-4 flex gap-2" onSubmit={handleCommentSubmit}>
          <textarea
            value={comment}
            rows={2}
            placeholder="댓글을 입력해주세요."
            aria-label="댓글 내용"
            className="border-black-300 text-body-14 text-black-900 focus:border-black-900 min-w-0 flex-1 resize-none rounded-xl border px-4 py-3 outline-none"
            onChange={handleCommentChange}
          />
          <button
            type="submit"
            className="bg-black-900 text-label-14 shrink-0 rounded-xl px-5 text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!comment.trim()}
          >
            등록
          </button>
        </form>

        <ul className="mt-5">
          {comments.map((item) => (
            <li key={item.id} className="border-black-200 border-b py-4">
              <div className="flex items-center gap-2">
                <span className="text-label-14 text-black-900">
                  {item.author}
                </span>
                <span className="text-caption-12 text-black-500">
                  {item.createdAt}
                </span>
              </div>
              <p className="text-body-14 text-black-700 mt-2">{item.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
