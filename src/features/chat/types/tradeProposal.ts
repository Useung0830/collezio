export interface TradeTerms {
  kind: "sale" | "exchange";
  amount: number;
  exchangeProductId: string | null;
  extraAmount: number;
  extraPayer: "none" | "requester" | "seller";
  method: "direct" | "parcel";
  scheduledAt: number;
  location: string;
  shippingPayer: "requester" | "seller" | "each";
  notes: string;
}

export type TradeProposalStatus =
  "pending" | "accepted" | "rejected" | "withdrawn" | "superseded";

export interface TradeProposal {
  id: string;
  senderId: string;
  recipientId: string;
  productId: string;
  previousId: string | null;
  terms: TradeTerms;
  status: TradeProposalStatus;
}

export interface TradeState {
  pendingId: string | null;
  acceptedId: string | null;
}
