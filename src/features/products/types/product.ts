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

export interface RegisteredProductDetail extends MyProductListItem {
  sellerId: string | null;
  description: string;
  delivery: ProductDelivery;
  imageUrls: string[];
}
