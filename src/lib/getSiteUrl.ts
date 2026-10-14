import "server-only";

export function getSiteUrl() {
  const url = new URL(process.env.SITE_URL || "https://collezio.vercel.app");
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL에는 경로가 없는 사이트의 HTTPS 주소를 지정해주세요.",
    );
  }
  return url;
}
