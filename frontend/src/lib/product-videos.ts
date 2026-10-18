export interface ProductVideo {
  id: number;
  src: string;
  title: string;
}

/** Only resolved WordPress MP4 attachments enter the storefront. */
export function parseProductVideos(value: unknown): ProductVideo[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { id, src, title } = entry;
    if (!Number.isInteger(id) || id <= 0 || seen.has(id) || typeof src !== "string" || typeof title !== "string" || !title.trim()) return [];
    try {
      const url = new URL(src);
      if (!["http:", "https:"].includes(url.protocol) || !url.pathname.toLowerCase().endsWith(".mp4")) return [];
    } catch { return []; }
    seen.add(id);
    return [{ id, src, title }];
  });
}
