export function getCommunityImageUrl(url: string) {
  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "demo-collezio"
  ) {
    return url.replace(
      "https://firebasestorage.googleapis.com",
      "http://127.0.0.1:9199",
    );
  }
  return url;
}
