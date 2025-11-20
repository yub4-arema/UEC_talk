import { FetchAndSaveRssToFirestore } from "./FetchAndSaveRssToFirestore";

/**
 * 環境変数から複数のRSSフィードを取得して保存する
 * Cloud Functionsまたは定期ジョブから呼び出す想定
 */
export async function fetchAllRssFeeds(): Promise<{ success: boolean; results: Array<{ collectionName: string; savedCount: number; error?: string }> }> {
  const results: Array<{ collectionName: string; savedCount: number; error?: string }> = [];

  // 環境変数から RSS URL を取得
  const rssUrl1 = process.env.RSS_URL_1;
  const rssUrl2 = process.env.RSS_URL_2;

  // RSS 1 を取得・保存
  if (rssUrl1) {
    try {
      console.log(`📡 RSS URL 1 を取得中: ${rssUrl1}`);
      const savedCount = await FetchAndSaveRssToFirestore(rssUrl1, "rss_items");
      results.push({
        collectionName: "rss_items",
        savedCount,
      });
      console.log(`✅ RSS URL 1: ${savedCount}件保存しました`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error(`❌ RSS URL 1 エラー:`, errorMessage);
      results.push({
        collectionName: "rss_items",
        savedCount: 0,
        error: errorMessage,
      });
    }
  } else {
    console.warn("⚠️ RSS_URL_1 が環境変数に設定されていません");
  }

  // RSS 2 を取得・保存
  if (rssUrl2) {
    try {
      console.log(`📡 RSS URL 2 を取得中: ${rssUrl2}`);
      const savedCount = await FetchAndSaveRssToFirestore(rssUrl2, "rss_items_2");
      results.push({
        collectionName: "rss_items_2",
        savedCount,
      });
      console.log(`✅ RSS URL 2: ${savedCount}件保存しました`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error(`❌ RSS URL 2 エラー:`, errorMessage);
      results.push({
        collectionName: "rss_items_2",
        savedCount: 0,
        error: errorMessage,
      });
    }
  } else {
    console.warn("⚠️ RSS_URL_2 が環境変数に設定されていません");
  }

  return {
    success: results.some(r => r.savedCount > 0),
    results,
  };
}
