export function normalizeProductSearch(value: string): string {
  return (
    value
      .normalize("NFKC")
      .toLocaleLowerCase("ko-KR")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  ).join(" ");
}
