export interface PublicProfile {
  id: string;
  nickname: string;
  imageUrl: string | null;
  bio: string;
  rating: number | null;
  tradeCount: number | null;
}
