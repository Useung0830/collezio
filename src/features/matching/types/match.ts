import type { StaticImageData } from "next/image";

export type MatchProposalType = "received" | "sent" | "recommended";

export type MatchProposal = {
  id: number;
  type: MatchProposalType;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  status?: string;
  ownerName: string;
  tradeCount: number;
  rating: number;
  ownerImage: StaticImageData;
  ownedProductImage: StaticImageData;
  proposedProductImage: StaticImageData;
};
