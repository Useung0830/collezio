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

export type ProductDelivery =
  | { type: "direct"; location: string }
  | { type: "parcel"; shippingFee: number };

export interface ProductImage {
  url: string;
  path: string;
}

export interface CreateProductInput {
  title: string;
  description: string;
  transaction: ProductTransaction;
  delivery: ProductDelivery;
  images: ProductImage[];
}

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
  id: number | string;
  title: string;
  createdAt: string | null;
  image: StaticImageData | string | null;
  transaction: ProductTransaction;
  favoriteCount: number;
  chatCount: number;
}

export type ProductStatus = "available" | "reserved" | "completed";

export interface MyProductListItem extends ProductListItem {
  id: string;
  status: ProductStatus | null;
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

export interface RegisteredProductDetail extends MyProductListItem {
  description: string;
  delivery: ProductDelivery;
  imageUrls: string[];
}
