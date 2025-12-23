import { Latest50PostsResponse, Latest200RssResponse, Post, RssItem } from "../types";

const convertToISOString = (date: unknown): string => {
  try {
    if (!date) return "";
    if (typeof date === "string") return date;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === "object" && "toDate" in date && typeof (date as { toDate?: unknown }).toDate === "function") {
      return (date as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof date === "object" && "seconds" in date) {
      return new Date((date as { seconds: number }).seconds * 1000).toISOString();
    }
    const parsed = new Date(String(date));
    return isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  } catch {
    return "";
  }
};

const formatDateTime = (date: unknown): string => {
  const iso = convertToISOString(date);
  if (!iso) return "";
  const d = new Date(iso);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const formatDate = (date: unknown): string => {
  const iso = convertToISOString(date);
  if (!iso) return "";
  const d = new Date(iso);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
};

const isReplyOrRetweet = (text: string | undefined | null): boolean => {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return normalized.startsWith("r to ") || normalized.startsWith("rt by ");
};


export const postsToCompactList = (data?: Latest50PostsResponse | null): string => {
  if (!data?.posts || data.posts.length === 0) return "学生投稿はありません。";

  return data.posts
    .map((post: Post) => {
      const time = formatDateTime(post.createdAt);
      const author = post.authorName ? `${post.authorName}` : "@unknown";
      const content = (post.content || "").replace(/\s+/g, " ").trim();
      const category = post.category ? ` [${post.category}]` : "";
      return `- ${author}${category}${time ? ` (${time})` : ""}: ${content}`;
    })
    .join("\n");
};

export const studentRssToCompactList = (data?: Latest200RssResponse | null): string => {
  const items = data?.items || [];
  const filtered = items.filter((item) => {
    const text = item.title || item.description || item.content || "";
    return !isReplyOrRetweet(text);
  });

  if (filtered.length === 0) return "学生SNS投稿はありません。";

  return filtered
    .map((item) => {
      const time = formatDateTime(item.pubDate);
      const author = item.author ? `@${item.author}` : "@unknown";
      const text = (item.title || item.description || item.content || "").replace(/\s+/g, " ").trim();
      return `- ${author}${time ? ` (${time})` : ""}: ${text}`;
    })
    .join("\n");
};

export const officialRssToCompactList = (data?: Latest200RssResponse | null): string => {
  const items = data?.items || [];
  if (items.length === 0) return "公式ニュースはありません。";

  return items
    .map((item) => {
      const dateLabel = formatDate(item.pubDate);
      const title = (item.title || item.description || item.content || "").replace(/\s+/g, " ").trim();
      return `- ${dateLabel ? `[${dateLabel}] ` : ""}${title}`;
    })
    .join("\n");
};
