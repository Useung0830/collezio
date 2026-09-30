export function validateChatDocumentId(id: string) {
  if (!id || id.includes("/") || id === "." || id === "..") {
    throw new Error("채팅 정보를 확인할 수 없습니다.");
  }
}
