"use client";

import { useState } from "react";
import Link from "next/link";

import { useCommunityAuthorId } from "@/features/community/hooks/useCommunityAuthorId";
import type { UserContentTab } from "@/features/community/types/userContent";

import UserCommentList from "./UserCommentList";
import UserContentTabs from "./UserContentTabs";
import UserPostList from "./UserPostList";

export default function UserContentHistory() {
  const userId = useCommunityAuthorId();
  const [activeTab, setActiveTab] = useState<UserContentTab>("posts");

  return (
    <section aria-labelledby="user-content-title">
      <h2 id="user-content-title" className="text-heading-20 text-black-900">
        내가 쓴 글/댓글
      </h2>

      {userId === undefined ? (
        <p role="status" className="text-body-14 text-black-900 mt-4">
          로그인 상태를 확인하고 있습니다.
        </p>
      ) : userId === null ? (
        <p className="text-body-14 text-black-900 mt-4">
          <Link href="/login" className="underline">
            로그인
          </Link>{" "}
          후 내가 쓴 글과 댓글을 확인할 수 있습니다.
        </p>
      ) : (
        <div key={userId} className="mt-3">
          <UserContentTabs activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === "posts" ? (
            <UserPostList userId={userId} />
          ) : (
            <UserCommentList userId={userId} />
          )}
        </div>
      )}
    </section>
  );
}
