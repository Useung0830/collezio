const MAX_PHRASE_WORDS = 4;

export function normalizeProductSearch(value) {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR");
}

export function getProductTitleTerms(title) {
  const words = normalizeProductSearch(title).match(/[\p{L}\p{N}]+/gu) ?? [];
  const terms = new Set();
  for (let start = 0; start < words.length; start++) {
    for (
      let length = 1;
      length <= MAX_PHRASE_WORDS && start + length <= words.length;
      length++
    ) {
      terms.add(words.slice(start, start + length).join(" "));
    }
  }
  return [...terms];
}
