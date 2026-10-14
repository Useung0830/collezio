import type { StaticImageData } from "next/image";

export type ReviewTag = {
  id: number;
  label: string;
  count: number;
};

export type TradeProduct = {
  id: number;
  title: string;
  image: StaticImageData;
};

type CompletedTradeBase = {
  id: number;
  completedAt: string;
  partnerName: string;
  partnerImage: StaticImageData;
  partnerTradeCount: number;
  partnerRating: number;
};

export type ExchangeCompletedTrade = CompletedTradeBase & {
  type: "exchange";
  ownedProduct: TradeProduct;
  receivedProduct: TradeProduct;
};

export type SingleProductCompletedTrade = CompletedTradeBase & {
  type: "purchase" | "sale";
  product: TradeProduct;
  price: number;
  tradeMethod: "direct" | "parcel";
};

export type CompletedTrade =
  ExchangeCompletedTrade | SingleProductCompletedTrade;
