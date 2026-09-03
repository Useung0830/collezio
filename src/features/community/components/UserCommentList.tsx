import Link from "next/link";

import { userComments } from "@/features/community/mocks/userContent";

export default function UserCommentList() {
  return (
    <ul role="tabpanel">
      {userComments.map((comment) => (
        <li
          key={comment.id}
          className="border-black-200 border-b py-4 first:pt-5"
        >
          <Link href={`/community/${comment.postId}`} className="block">
            <p className="text-caption-13 text-black-600">
              {comment.postTitle}
            </p>
            <h3 className="text-label-16 text-black-900 mt-1">
              {comment.content}
            </h3>
            <p className="text-caption-12 text-black-600 mt-3">
              {comment.createdAt}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
