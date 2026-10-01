import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { logoutAccount } from "@/features/auth/api/logoutAccount";

export function useLogoutMutation() {
  const router = useRouter();
  const isRunning = useRef(false);
  const mutation = useMutation({
    mutationFn: logoutAccount,
    // Firebase 로그아웃은 로컬 인증 상태를 지우므로 오프라인에서도 실행합니다.
    networkMode: "always",
    retry: false,
  });

  const logout = async () => {
    if (isRunning.current) return false;
    isRunning.current = true;
    try {
      await mutation.mutateAsync();
      router.replace("/");
      return true;
    } catch {
      return false;
    } finally {
      isRunning.current = false;
    }
  };

  return { logout, isPending: mutation.isPending, isError: mutation.isError };
}
