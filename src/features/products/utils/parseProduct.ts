import { Timestamp } from "firebase/firestore";

import type {
  MyProductListItem,
  ProductDelivery,
  ProductTransaction,
  RegisteredProductDetail,
} from "@/features/products/types/product";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTransaction(value: unknown): ProductTransaction {
  if (isRecord(value)) {
    if (
      value.type === "sale" &&
      typeof value.price === "number" &&
      Number.isSafeInteger(value.price) &&
      value.price >= 0
    ) {
      return { type: "sale", price: value.price };
    }

    if (
      value.type === "exchange" &&
      typeof value.desiredItemName === "string" &&
      value.desiredItemName.trim()
    ) {
      return { type: "exchange", desiredItemName: value.desiredItemName };
    }
  }

  throw new Error("상품의 거래 정보를 확인할 수 없습니다.");
}

function getImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || !isRecord(images[0])) return null;
  const url = images[0].url;
  if (typeof url !== "string") return null;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "firebasestorage.googleapis.com" &&
      parsedUrl.port === "" &&
      !parsedUrl.username &&
      !parsedUrl.password
      ? url
      : null;
  } catch {
    return null;
  }
}

function getCount(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

export function parseMyProduct(id: string, data: unknown): MyProductListItem {
  if (!isRecord(data) || typeof data.title !== "string" || !data.title.trim()) {
    throw new Error("상품 정보를 확인할 수 없습니다.");
  }

  return {
    id,
    title: data.title,
    transaction: parseTransaction(data.transaction),
    image: getImageUrl(data.images),
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : null,
    status:
      data.status === "available" ||
      data.status === "reserved" ||
      data.status === "completed"
        ? data.status
        : null,
    favoriteCount: getCount(data.favoriteCount),
    chatCount: getCount(data.chatCount),
  };
}

function parseDelivery(value: unknown): ProductDelivery {
  if (isRecord(value)) {
    if (
      value.type === "direct" &&
      typeof value.location === "string" &&
      value.location.trim()
    ) {
      return { type: "direct", location: value.location };
    }
    if (
      value.type === "parcel" &&
      typeof value.shippingFee === "number" &&
      Number.isSafeInteger(value.shippingFee) &&
      value.shippingFee >= 0
    ) {
      return { type: "parcel", shippingFee: value.shippingFee };
    }
  }
  throw new Error("상품의 배송 정보를 확인할 수 없습니다.");
}

export function parseRegisteredProduct(
  id: string,
  data: unknown,
): RegisteredProductDetail {
  const product = parseMyProduct(id, data);
  if (
    !isRecord(data) ||
    typeof data.description !== "string" ||
    !data.description.trim()
  ) {
    throw new Error("상품 설명을 확인할 수 없습니다.");
  }
  const imageUrls = Array.isArray(data.images)
    ? [
        ...new Set(
          data.images
            .map((image) => getImageUrl([image]))
            .filter((url) => url !== null),
        ),
      ]
    : [];
  return {
    ...product,
    description: data.description,
    sellerId:
      typeof data.sellerId === "string" &&
      data.sellerId.trim() &&
      !data.sellerId.includes("/") &&
      data.sellerId !== "." &&
      data.sellerId !== ".."
        ? data.sellerId
        : null,
    delivery: parseDelivery(data.delivery),
    imageUrls,
  };
}
