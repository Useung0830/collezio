export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  imagePath?: string;
  imagePaths?: string[];
  previousMessageId?: string;
}

export interface SendChatMessageInput {
  roomId: string;
  messageId: string;
  userId: string;
  content: string;
  image?: File;
  images?: File[];
}
