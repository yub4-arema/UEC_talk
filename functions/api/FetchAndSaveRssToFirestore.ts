import Parser from "rss-parser";
import { collection, writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { RssItem } from "../types";
import { createHash } from "crypto";

const BATCH_SIZE = 500;

type AllowedHostCheck = (hostname: string) => boolean;

function buildAllowedHostCheck(): AllowedHostCheck {
  const raw = process.env.RSS_ALLOWED_HOSTS || "nitter.shibadogcap.com";
  const allowed = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.toLowerCase());

  return (hostname: string) => {
    const normalized = hostname.toLowerCase();
    return allowed.some((allowedHost) =>
      normalized === allowedHost || normalized.endsWith(`.${allowedHost}`)
    );
  };
}

function isValidProtocol(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

function createDocId(rssItem: RssItem): string {
  return createHash("sha256")
    .update(rssItem.guid || rssItem.link)
    .digest("hex");
}

function validateRssUrl(rssUrl: string): void {
  if (!rssUrl || typeof rssUrl !== "string" || rssUrl.trim() === "") {
    throw new Error("RSS URLが空です。");
  }

  let url: URL;
  try {
    url = new URL(rssUrl);
  } catch (error) {
    throw new Error(`無効なURL形式です: ${rssUrl}`);
  }

  if (!isValidProtocol(url)) {
    throw new Error("HTTPまたはHTTPSプロトコルのURLのみサポートされています");
  }

  const isAllowed = buildAllowedHostCheck();
  if (!isAllowed(url.hostname)) {
    throw new Error(`許可されていないホストです: ${url.hostname}`);
  }
}

export async function FetchAndSaveRssToFirestore(rssUrl: string): Promise<number> {
  validateRssUrl(rssUrl);

  try {
    const parser = new Parser({
      timeout: 10000,
      maxRedirects: 5,
    });

    const feed = await parser.parseURL(rssUrl);
    const items = (feed.items || []).slice(0, 200);

    const rssCollection = collection(db, "rss_items");
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalSavedCount = 0;

    for (const item of items) {
      const rssItem: RssItem = {
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        description: item.contentSnippet || item.content || "",
        author: item.creator || item.author,
        content: item.content,
        categories: item.categories,
        guid: item.guid || item.link,
      };

      const docId = createDocId(rssItem);
      const docRef = doc(rssCollection, docId);

      // Remove undefined fields before saving to Firestore
      const dataToSave = {
        ...rssItem,
        pubDate: Timestamp.fromDate(rssItem.pubDate),
      };
      // Explicitly remove undefined fields to comply with Firestore constraints
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key as keyof typeof dataToSave] === undefined) {
          delete dataToSave[key as keyof typeof dataToSave];
        }
      });

      batch.set(docRef, dataToSave, { merge: true });

      batchCount++;
      totalSavedCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`${totalSavedCount}件のRSSアイテムをFirestoreに保存しました`);
    return totalSavedCount;
  } catch (error) {
    console.error("RSSの取得または保存に失敗しました:", error);
    throw error;
  }
}
