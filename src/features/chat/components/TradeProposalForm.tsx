"use client";

import { useEffect, useState } from "react";

import ChatActionDialog from "@/features/chat/components/ChatActionDialog";
import type { TradeTerms } from "@/features/chat/types/tradeProposal";
import { validateTradeTerms } from "@/features/chat/utils/validateTradeTerms";

interface TradeProposalFormProps {
  initial: TradeTerms;
  draftKey: string;
  onSubmit: (terms: TradeTerms) => Promise<void>;
  onClose: () => void;
  renderProducts?: (
    selected: string | null,
    onSelect: (id: string) => void,
  ) => React.ReactNode;
}

const inputClass =
  "border-black-200 mt-1 w-full rounded-lg border p-3 disabled:opacity-50";

export default function TradeProposalForm({
  initial,
  draftKey,
  onSubmit,
  onClose,
  renderProducts,
}: TradeProposalFormProps) {
  const [terms, setTerms] = useState<TradeTerms>(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved) as Record<string, unknown>;
        if (
          draft.kind === initial.kind &&
          Object.entries(initial).every(([key, value]) =>
            key === "exchangeProductId"
              ? draft[key] === null || typeof draft[key] === "string"
              : typeof draft[key] === typeof value,
          )
        )
          return draft as unknown as TradeTerms;
      }
    } catch {
      /* Expired or incomplete drafts use the current product defaults. */
    }
    return initial;
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const dateValue = terms.scheduledAt
    ? new Date(
        terms.scheduledAt -
          new Date(terms.scheduledAt).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
  const update = (patch: Partial<TradeTerms>) =>
    setTerms((current) => ({ ...current, ...patch }));
  useEffect(() => {
    sessionStorage.setItem(draftKey, JSON.stringify(terms));
  }, [draftKey, terms]);
  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;
    setError("");
    setIsPending(true);
    try {
      await onSubmit(validateTradeTerms(terms));
      sessionStorage.removeItem(draftKey);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "제안을 보내지 못했습니다.",
      );
    } finally {
      setIsPending(false);
    }
  };
  return (
    <ChatActionDialog
      title={terms.kind === "sale" ? "구매 제안" : "교환 제안"}
      isPending={isPending}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="text-body-14 mt-4 space-y-4"
      >
        <fieldset disabled={isPending} className="space-y-4">
          {terms.kind === "sale" ? (
            <label className="block">
              거래 금액 (원)
              <input
                className={inputClass}
                type="number"
                min="0"
                max="1000000000"
                required
                value={terms.amount}
                onChange={(e) => update({ amount: Number(e.target.value) })}
              />
            </label>
          ) : (
            <>
              {renderProducts?.(terms.exchangeProductId, (id) =>
                update({ exchangeProductId: id }),
              )}
              <label className="block">
                추가금 (원)
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="1000000000"
                  value={terms.extraAmount}
                  onChange={(e) => {
                    const extraAmount = Number(e.target.value);
                    update({
                      extraAmount,
                      extraPayer: extraAmount ? "requester" : "none",
                    });
                  }}
                />
              </label>
              {terms.extraAmount > 0 && (
                <label className="block">
                  추가금 지급자
                  <select
                    className={inputClass}
                    value={terms.extraPayer}
                    onChange={(e) =>
                      update({
                        extraPayer: e.target.value as TradeTerms["extraPayer"],
                      })
                    }
                  >
                    <option value="requester">교환 신청자</option>
                    <option value="seller">상품 등록자</option>
                  </select>
                </label>
              )}
            </>
          )}
          <label className="block">
            거래 방식
            <select
              className={inputClass}
              value={terms.method}
              onChange={(e) =>
                update({ method: e.target.value as TradeTerms["method"] })
              }
            >
              <option value="direct">직거래</option>
              <option value="parcel">택배</option>
            </select>
          </label>
          <label className="block">
            {terms.method === "direct"
              ? "약속 날짜·시간"
              : "발송 예정 날짜·시간"}
            <input
              className={inputClass}
              type="datetime-local"
              required
              value={dateValue}
              onChange={(e) =>
                update({
                  scheduledAt: e.target.value
                    ? new Date(e.target.value).getTime()
                    : 0,
                })
              }
            />
          </label>
          {terms.method === "direct" ? (
            <label className="block">
              거래 장소
              <input
                className={inputClass}
                required
                maxLength={200}
                value={terms.location}
                onChange={(e) => update({ location: e.target.value })}
              />
            </label>
          ) : (
            <label className="block">
              택배비 부담
              <select
                className={inputClass}
                value={terms.shippingPayer}
                onChange={(e) =>
                  update({
                    shippingPayer: e.target
                      .value as TradeTerms["shippingPayer"],
                  })
                }
              >
                <option value="requester">신청자 부담</option>
                <option value="seller">상품 등록자 부담</option>
                {terms.kind === "exchange" && (
                  <option value="each">각자 발송 비용 부담</option>
                )}
              </select>
            </label>
          )}
          <label className="block">
            추가 요청사항
            <textarea
              className={inputClass}
              maxLength={1000}
              rows={3}
              value={terms.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </label>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="p-3"
          >
            닫기
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-brand-blue rounded-lg px-4 py-3 text-white disabled:opacity-50"
          >
            {isPending ? "보내는 중…" : "제안 보내기"}
          </button>
        </div>
      </form>
    </ChatActionDialog>
  );
}
