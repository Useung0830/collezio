import type {
  ChatRoomView,
  RegisteredChatRoom,
} from "@/features/chat/types/registeredChatRoom";
import { getRegisteredProduct } from "@/features/products/api/getRegisteredProduct";
import { getPublicProfile } from "@/features/user/api/getPublicProfile";

import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getChatRoomView(
  room: RegisteredChatRoom,
  userId: string,
): Promise<ChatRoomView> {
  validateFirebaseUser(userId);
  const partnerId =
    room.requesterId === userId ? room.sellerId : room.requesterId;
  const [product, profile] = await Promise.all([
    getRegisteredProduct(room.productId, userId),
    getPublicProfile(partnerId),
  ]);
  validateFirebaseUser(userId);
  const isPartnerWithdrawn =
    room.withdrawnUserIds?.includes(partnerId) ?? false;
  return {
    ...room,
    isPartnerWithdrawn,
    partnerName: isPartnerWithdrawn
      ? "탈퇴 회원"
      : (profile?.nickname ?? "프로필 없는 사용자"),
    partnerImageUrl: isPartnerWithdrawn ? null : (profile?.imageUrl ?? null),
    productTitle: product?.title ?? "삭제된 상품",
    productImageUrl: product?.imageUrls[0] ?? null,
    transaction: product?.transaction ?? null,
  };
}
