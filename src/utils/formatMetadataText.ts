export function formatMetadataText(value: string, maxLength: number) {
  const characters = Array.from(value.replace(/\s+/g, " ").trim());
  if (characters.length <= maxLength) return characters.join("");
  return `${characters
    .slice(0, maxLength - 1)
    .join("")
    .trimEnd()}…`;
}
