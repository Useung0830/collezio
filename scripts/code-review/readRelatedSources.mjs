import path from "node:path";

export async function readRelatedSources({ filename, source, sha, readFile }) {
  const related = [];
  const visited = new Set();
  let bytes = 0;
  let candidates = 0;
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    const specifier = match[1];
    const base = specifier.startsWith("@/")
      ? `src/${specifier.slice(2)}`
      : specifier.startsWith(".")
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(filename), specifier),
          )
        : null;
    if (!base || !/^src\/[\w/-]+$/.test(base) || visited.has(base)) continue;
    visited.add(base);
    if (related.length >= 6 || candidates++ >= 16) break;
    for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const relatedPath = base + suffix;
      if (relatedPath === filename) continue;
      try {
        const content = await readFile(relatedPath, sha);
        const size = Buffer.byteLength(content);
        if (bytes + size <= 24_000) {
          related.push({ path: relatedPath, source: content });
          bytes += size;
        }
        break;
      } catch (error) {
        if (!/^GitHub 요청 실패: 404 /.test(error.message)) throw error;
      }
    }
  }
  return related;
}
