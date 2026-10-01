const reasonCodes = new Set([
  "infrequent-use",
  "discovery",
  "inconvenience",
  "trust",
  "other",
]);

export function parseWithdrawalFeedback(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !["reasons", "detail"].includes(key)) ||
    !Array.isArray(value.reasons) ||
    value.reasons.length > 5 ||
    value.reasons.some((reason) => !reasonCodes.has(reason)) ||
    new Set(value.reasons).size !== value.reasons.length ||
    typeof value.detail !== "string" ||
    value.detail.length > 200
  ) {
    throw new Error("탈퇴 사유 입력을 확인해주세요.");
  }
  return { reasons: value.reasons, detail: value.detail.trim() };
}
