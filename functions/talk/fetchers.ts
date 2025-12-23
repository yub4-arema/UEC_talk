import { fetchAllRssFeeds } from "../api/fetchAllRssFeeds";
import { getLatestPosts } from "../posts";
import { getLatest200RssFromFirestore } from "../rss";
import { Latest50PostsResponse, Latest200RssResponse } from "../types";
import { officialRssToCompactList, postsToCompactList, studentRssToCompactList } from "./csv";

const parseEnvPositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const RSS_ITEMS_FETCH_LIMIT = parseEnvPositiveInt(process.env.RSS_ITEMS_FETCH_LIMIT, 200);
const RSS_ITEMS_2_FETCH_LIMIT = parseEnvPositiveInt(process.env.RSS_ITEMS_2_FETCH_LIMIT, 20);

const safeGetLatestPosts = async (): Promise<Latest50PostsResponse> => {
  try {
    return await getLatestPosts();
  } catch (error) {
    console.error("最新投稿の取得に失敗しました:", error);
    return { posts: [] };
  }
};

const safeGetLatestRss = async (collectionName: string, limit?: number): Promise<Latest200RssResponse> => {
  try {
    return await getLatest200RssFromFirestore(collectionName, limit);
  } catch (error) {
    console.error(`${collectionName}のRSS取得に失敗しました:`, error);
    return { items: [] };
  }
};

export const refreshRssFeeds = () => {
  fetchAllRssFeeds().catch((error) => {
    console.error("RSSフィード更新エラー:", error);
  });
};

export const buildTalkDataContext = async () => {
  const [latestPosts, rss1, rss2] = await Promise.all([
    safeGetLatestPosts(),
    safeGetLatestRss("rss_items", RSS_ITEMS_FETCH_LIMIT),
    safeGetLatestRss("rss_items_2", RSS_ITEMS_2_FETCH_LIMIT),
  ]);

  return {
    postsText: postsToCompactList(latestPosts),
    studentRssText: studentRssToCompactList(rss1),
    officialRssText: officialRssToCompactList(rss2),
  };
};
