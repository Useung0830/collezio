import { useRef } from "react";
import { toast } from "react-toastify/unstyled";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "firebase/auth";

import { deleteAccount } from "@/features/auth/api/deleteAccount";
import { getWithdrawalError } from "@/features/auth/utils/getWithdrawalError";

import { firebaseAuth } from "@/lib/firebase";

export function useWithdrawalMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRunning = useRef(false);
  const mutation = useMutation({
    mutationFn: async (input: Parameters<typeof deleteAccount>[0]) => {
      const result = await deleteAccount(input);
      await signOut(firebaseAuth);
      return result;
    },
    retry: false,
    networkMode: "always",
  });
  const withdraw = async (input: Parameters<typeof deleteAccount>[0]) => {
    if (isRunning.current) return false;
    isRunning.current = true;
    try {
      const result = await mutation.mutateAsync(input);
      queryClient.removeQueries();
      router.replace("/");
      toast.success(
        result.status === "completed"
          ? "회원 탈퇴가 완료되었습니다."
          : "탈퇴가 접수되었습니다. 남은 데이터는 서버에서 정리하고 있습니다.",
      );
      return true;
    } catch {
      return false;
    } finally {
      isRunning.current = false;
    }
  };
  return {
    withdraw,
    isPending: mutation.isPending,
    errorMessage: getWithdrawalError(mutation.error),
  };
}
