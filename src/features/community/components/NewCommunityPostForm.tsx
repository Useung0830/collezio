"use client";

import { useRouter } from "next/navigation";

import ImageUploader from "@/components/common/ImageUploader";

import CloseIcon from "@/assets/icons/icon-close.svg";

export default function NewCommunityPostForm() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/community");
  };

  return (
    <section className="mx-auto w-full max-w-184 pb-12">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="글쓰기 닫기" onClick={handleClose}>
          <CloseIcon className="size-5" aria-hidden="true" />
        </button>
        <h1 className="text-heading-24 text-black-900">글쓰기</h1>
      </div>

      <form
        className="mt-6 flex min-h-[calc(100vh-13rem)] flex-col"
        onSubmit={handleSubmit}
      >
        <input
          name="title"
          type="text"
          required
          placeholder="제목을 입력하세요."
          aria-label="게시글 제목"
          className="text-heading-20 text-black-900 placeholder:text-black-500 w-full outline-none"
        />
        <textarea
          name="content"
          required
          placeholder="자유롭게 이야기를 나눠보세요."
          aria-label="게시글 내용"
          className="text-body-16 text-black-900 placeholder:text-black-500 mt-2 min-h-80 w-full flex-1 resize-none outline-none"
        />

        <div className="mt-6">
          <ImageUploader maxImageCount={10} triggerVariant="text" />
          <button
            type="submit"
            className="border-black-300 text-label-16 text-black-900 mt-5 flex h-13 w-full items-center justify-center rounded-2xl border"
          >
            작성 완료
          </button>
        </div>
      </form>
    </section>
  );
}
