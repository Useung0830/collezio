import type {
  ChatRoomView,
  RegisteredChatRoom,
} from "@/features/chat/types/registeredChatRoom";
import { validateChatUser } from "@/features/chat/utils/validateChatUser";
import { getRegisteredProduct } from "@/features/products/api/getRegisteredProduct";
import { getPublicProfile } from "@/features/user/api/getPublicProfile";

export async function getChatRoomView(
  room: RegisteredChatRoom,
  userId: string,
): Promise<ChatRoomView> {
  validateChatUser(userId);
  const partnerId =
    room.requesterId === userId ? room.sellerId : room.requesterId;
  const [product, profile] = await Promise.all([
    getRegisteredProduct(room.productId, userId),
    getPublicProfile(partnerId),
  ]);
  validateChatUser(userId);
  return {
    ...room,
    partnerName: profile?.nickname ?? "프로필 없는 사용자",
    partnerImageUrl: profile?.imageUrl ?? null,
    productTitle: product?.title ?? "삭제된 상품",
    productImageUrl: product?.imageUrls[0] ?? null,
    transaction: product?.transaction ?? null,
  };
}
