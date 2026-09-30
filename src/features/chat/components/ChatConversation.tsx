import Button from "@/components/common/button/Button";

export default function ChatConversation() {
  return (
    <section className="bg-black-50 flex min-h-0 flex-1 flex-col gap-3 px-4 py-5">
      <div className="text-body-14 text-black-900 flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p>아직 시작하지 않은 대화입니다.</p>
        <p>첫 메시지를 보내면 상대방의 채팅 목록에도 표시됩니다.</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">메시지</span>
          <input
            disabled
            placeholder="메시지 전송 준비 중"
            className="border-black-200 text-body-14 text-black-400 w-full rounded-full border bg-white px-4 py-3"
          />
        </label>
        <Button disabled size="sm" aria-label="메시지 전송">
          전송
        </Button>
      </div>
    </section>
  );
}
