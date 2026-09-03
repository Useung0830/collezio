"use client";

import { useState } from "react";

import type { UserContentTab } from "@/features/community/types/userContent";

import UserCommentList from "./UserCommentList";
import UserContentTabs from "./UserContentTabs";
import UserPostList from "./UserPostList";

export default function UserContentHistory() {
  const [activeTab, setActiveTab] = useState<UserContentTab>("posts");

  return (
    <section aria-labelledby="user-content-title">
      <h2 id="user-content-title" className="text-heading-20 text-black-900">
        내가 쓴 글/댓글
      </h2>

      <div className="mt-3">
        <UserContentTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "posts" ? <UserPostList /> : <UserCommentList />}
      </div>
    </section>
  );
}
