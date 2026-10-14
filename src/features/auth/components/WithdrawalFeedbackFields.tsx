import type { ChangeEvent } from "react";

import {
  MAX_WITHDRAWAL_DETAIL_LENGTH,
  WITHDRAWAL_REASONS,
} from "@/features/auth/constants/withdrawal";
import type { WithdrawalFeedback } from "@/features/auth/types/withdrawal";

type WithdrawalFeedbackFieldsProps = {
  value: WithdrawalFeedback;
  onChange: (value: WithdrawalFeedback) => void;
  disabled?: boolean;
};

export default function WithdrawalFeedbackFields({
  value,
  onChange,
  disabled = false,
}: WithdrawalFeedbackFieldsProps) {
  const handleReasonChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: reason, checked } = event.currentTarget;
    onChange({
      ...value,
      reasons: checked
        ? [...value.reasons, reason]
        : value.reasons.filter((selected) => selected !== reason),
    });
  };

  const handleDetailChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, detail: event.currentTarget.value });
  };

  return (
    <fieldset disabled={disabled} className="text-black-900 mt-5">
      <legend className="text-heading-20">
        탈퇴 사유를 알려주시면 개선을 위해 노력하겠습니다.
      </legend>
      <p className="text-body-14 mt-3">
        선택 사항이며, 여러 개를 선택할 수 있어요.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {WITHDRAWAL_REASONS.map((reason) => (
          <label
            key={reason.code}
            className="text-body-16 flex items-center gap-2"
          >
            <input
              type="checkbox"
              value={reason.code}
              checked={value.reasons.includes(reason.code)}
              onChange={handleReasonChange}
              className="accent-black-900 size-4"
            />
            {reason.label}
          </label>
        ))}
      </div>
      <div className="border-black-300 relative mt-5 rounded-2xl border">
        <textarea
          value={value.detail}
          maxLength={MAX_WITHDRAWAL_DETAIL_LENGTH}
          aria-label="탈퇴 사유 상세 입력"
          aria-describedby="withdrawal-feedback-help"
          className="text-body-14 min-h-28 w-full resize-none rounded-2xl bg-transparent p-4 pb-8"
          onChange={handleDetailChange}
        />
        <span className="text-caption-12 absolute right-4 bottom-3">
          {value.detail.length}/{MAX_WITHDRAWAL_DETAIL_LENGTH}
        </span>
      </div>
      <p id="withdrawal-feedback-help" className="text-body-14 mt-2">
        서비스 개선에 활용됩니다. 연락처 등 개인정보는 입력하지 마세요.
      </p>
    </fieldset>
  );
}
