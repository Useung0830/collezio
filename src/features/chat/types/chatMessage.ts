export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export interface SendChatMessageInput {
  roomId: string;
  messageId: string;
  userId: string;
  content: string;
}
