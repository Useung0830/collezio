import type { StaticImageData } from "next/image";

interface SaleTransaction {
  type: "sale";
  price: number;
}

interface ExchangeTransaction {
  type: "exchange";
  desiredItemName: string;
}

export type ProductTransaction = SaleTransaction | ExchangeTransaction;

export interface ProductSeller {
  id: number;
  nickname: string;
  tradeCount: number;
  rating: number;
  profileImageUrl: string;
}

export interface ProductDetailMetrics {
  favoriteCount: number;
  offerCount: number;
  chatCount: number;
}

export interface ProductListItem {
  id: number;
  title: string;
  createdAt: string;
  image: StaticImageData;
  transaction: ProductTransaction;
  favoriteCount: number;
  chatCount: number;
}

export interface ProductDetail {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  description: string;
  image: StaticImageData;
  transaction: ProductTransaction;
  seller: ProductSeller;
  metrics: ProductDetailMetrics;
}
