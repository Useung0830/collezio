import type { CHAT_REPORT_REASONS } from "@/features/chat/constants/chatReport";

export interface ChatParticipantInput {
  userId: string;
  partnerId: string;
  roomId: string;
}

export interface CreateChatReportInput extends ChatParticipantInput {
  reportId: string;
  reason: (typeof CHAT_REPORT_REASONS)[number];
  details: string;
}

export interface ChatBlockStatus {
  isBlockedByMe: boolean;
  isBlockedByPartner: boolean;
}
