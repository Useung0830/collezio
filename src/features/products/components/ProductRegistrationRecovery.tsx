"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { FirebaseError } from "firebase/app";

import Button from "@/components/common/button/Button";
import {
  acknowledgeProductRegistration,
  cancelProductRegistration,
  forgetRegistration,
  registrationUserId,
} from "@/features/products/api/productRegistration";
import { resumeProductRegistration } from "@/features/products/api/registerProduct";
import type { ProductRegistration } from "@/features/products/types/productRegistration";

type ProductRegistrationRecoveryProps = {
  registration: ProductRegistration;
  onRefresh: () => void;
};
export default function ProductRegistrationRecovery({
  registration,
  onRefresh,
}: ProductRegistrationRecoveryProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: async (action: "resume" | "cancel") => {
      if (action === "cancel") {
        if (registration.status === "committed")
          await acknowledgeProductRegistration(registration.id);
        else await cancelProductRegistration(registration.id);
        forgetRegistration(await registrationUserId(), registration.id);
        return null;
      }
      const id = await resumeProductRegistration(registration, files);
      forgetRegistration(await registrationUserId(), registration.id);
      return id;
    },
    retry: false,
    onSuccess: (id) => {
      if (id) router.replace("/products/" + id);
      else onRefresh();
    },
    onError: (error) => {
      setMessage(
        error instanceof FirebaseError
          ? error.message.replace(/\s+\[\d{3}\]$/, "")
          : error.message,
      );
      onRefresh();
    },
  });
  const isPending = registration.status === "pending";
  const isCommitted = registration.status === "committed";
  const missing = registration.files.filter((file) => file.status !== "ready");
  return (
    <section
      className="border-black-300 text-black-900 flex flex-col gap-4 rounded-2xl border p-5"
      aria-label="이전 상품 등록"
    >
      <h2 className="text-label-16">
        {isCommitted
          ? "이미 등록된 상품이 있습니다"
          : isPending
            ? "이어서 등록할 상품이 있습니다"
            : "이전 등록 작업이 만료되거나 취소되었습니다"}
      </h2>
      {registration.product && (
        <p className="text-body-16">{registration.product.title}</p>
      )}
      {isPending && (
        <>
          <p className="text-body-16">
            사진 {registration.files.length - missing.length}/
            {registration.files.length}장 저장 완료. 아직 저장되지 않은 사진은
            원본을 다시 선택해주세요.
          </p>
          {missing.length > 0 && (
            <label className="text-body-16">
              누락된 사진: {missing.map((file) => file.name).join(", ")}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={mutation.isPending}
                onChange={(event) =>
                  setFiles(Array.from(event.target.files ?? []))
                }
                aria-label="누락된 사진 선택"
              />
            </label>
          )}
        </>
      )}
      {message && (
        <p role="alert" className="text-body-16">
          {message}
        </p>
      )}
      <div className="flex gap-3">
        {(isPending || isCommitted) && (
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate("resume")}
          >
            {isCommitted ? "등록된 상품 보기" : "등록 이어서 진행"}
          </Button>
        )}
        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("cancel")}
        >
          {isPending ? "취소하고 새로 작성" : "새로 작성"}
        </Button>
        <Button type="button" disabled={mutation.isPending} onClick={onRefresh}>
          상태 다시 확인
        </Button>
      </div>
    </section>
  );
}
