export const WITHDRAWAL_REASONS = [
  { code: "infrequent-use", label: "낮은 서비스 이용 빈도" },
  { code: "discovery", label: "원하는 상품 탐색 및 교환의 어려움" },
  { code: "inconvenience", label: "상품 등록 및 거래 과정의 불편" },
  { code: "trust", label: "거래 안전성 및 신뢰에 대한 우려" },
  { code: "other", label: "기타 사유" },
] as const;

export const MAX_WITHDRAWAL_DETAIL_LENGTH = 200;
