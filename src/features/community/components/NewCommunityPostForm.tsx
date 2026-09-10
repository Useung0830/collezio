"use client";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";
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
        <IconButton size="sm" aria-label="글쓰기 닫기" onClick={handleClose}>
          <CloseIcon className="size-5" aria-hidden="true" />
        </IconButton>
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
          <Button type="submit" shape="rounded" className="mt-5 h-13 w-full">
            작성 완료
          </Button>
        </div>
      </form>
    </section>
  );
}
