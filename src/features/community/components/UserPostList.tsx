import Link from "next/link";

import { userPosts } from "@/features/community/mocks/userContent";

export default function UserPostList() {
  return (
    <ul role="tabpanel">
      {userPosts.map((post) => (
        <li key={post.id} className="border-black-200 border-b py-4 first:pt-5">
          <Link href={`/community/${post.id}`} className="block">
            <h3 className="text-label-16 text-black-900">{post.title}</h3>
            <p className="text-body-14 text-black-700 mt-1 line-clamp-2">
              {post.summary}
            </p>
            <p className="text-caption-12 text-black-600 mt-3">
              {post.createdAt}
              <span className="mx-2">·</span>
              조회 {post.viewCount.toLocaleString("ko-KR")}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
