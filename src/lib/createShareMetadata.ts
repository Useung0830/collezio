import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/getSiteUrl";

type ShareMetadataInput = {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  type: "website" | "article";
  noindex?: boolean;
};

export function createShareMetadata({
  title,
  description,
  path,
  imageUrl,
  type,
  noindex = false,
}: ShareMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = new URL(path, siteUrl).toString();
  const shareTitle = `${title} | Collezio`;
  const image = imageUrl
    ? { url: imageUrl, alt: `${title} 대표 이미지` }
    : {
        url: new URL("/share-default.jpg", siteUrl).toString(),
        alt: "Collezio — 소중한 컬렉션을 교환으로 연결하다",
        width: 1123,
        height: 320,
      };

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noindex && { robots: { index: false } }),
    openGraph: {
      title: shareTitle,
      description,
      url,
      siteName: "Collezio",
      locale: "ko_KR",
      type,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image],
    },
  };
}
