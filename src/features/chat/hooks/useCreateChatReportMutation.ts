import { useMutation } from "@tanstack/react-query";

import { createChatReport } from "@/features/chat/api/createChatReport";

export function useCreateChatReportMutation() {
  return useMutation({
    mutationFn: createChatReport,
    retry: false,
    networkMode: "always",
  });
}
