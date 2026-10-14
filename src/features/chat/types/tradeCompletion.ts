export interface TradeCompletion {
  confirmedBy: string[];
  deferredBy: string[];
  reviewedBy: string[];
}

export interface TradeReview {
  rating: number;
  content: string;
}
