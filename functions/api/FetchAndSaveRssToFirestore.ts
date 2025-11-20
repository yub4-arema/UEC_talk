import Parser from "rss-parser";
import { collection, writeBatch, doc, Timestamp, getDoc, setDoc, getDocs } from "firebase/firestore";
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
    .update(rssItem.guid || rssItem.link || "")
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

async function getLastExecutionTime(collectionName: string = "rss_items"): Promise<Date | null> {
  try {
    const metadataRef = doc(db, "rss_metadata", collectionName);
    const snap = await getDoc(metadataRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.lastExecutionTime instanceof Timestamp) {
        return data.lastExecutionTime.toDate();
      }
    }
  } catch (error) {
    console.warn(`${collectionName}: 前回実行時刻の取得に失敗しました:`, error);
  }
  return null;
}

async function saveExecutionTime(collectionName: string = "rss_items"): Promise<void> {
  try {
    const metadataRef = doc(db, "rss_metadata", collectionName);
    await setDoc(metadataRef, {
      lastExecutionTime: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.warn(`${collectionName}: 実行時刻の保存に失敗しました:`, error);
  }
}

function shouldSaveItem(itemPubDate: Date, lastExecutionTime: Date | null): boolean {
  if (lastExecutionTime === null) {
    return true;
  }
  return itemPubDate.getTime() > lastExecutionTime.getTime();
}

export async function FetchAndSaveRssToFirestore(
  rssUrl: string,
  collectionName: string = "rss_items"
): Promise<number> {
  validateRssUrl(rssUrl);

  try {
    const parser = new Parser({
      timeout: 10000,
      maxRedirects: 5,
    });

    const feed = await parser.parseURL(rssUrl);
    const items = (feed.items || []).slice(0, 200);

    // Get last execution time for this specific collection
    const lastExecutionTime = await getLastExecutionTime(collectionName);
    const now = new Date();
    
    // Check if 10 minutes have passed since last execution
    const tenMinutesInMs = 30 * 60 * 1000;
    const shouldFetch = lastExecutionTime === null || 
                        (now.getTime() - lastExecutionTime.getTime()) >= tenMinutesInMs;

    if (!shouldFetch) {
      const minutesPassed = Math.floor((now.getTime() - lastExecutionTime.getTime()) / 60000);
      console.log(`${collectionName}: 前回実行から${minutesPassed}分経過しています。30分以上経過するまで待機します。`);
      return 0;
    }

    const rssCollection = collection(db, collectionName);
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalSavedCount = 0;
    const MAX_SAVE_COUNT = 200;

    for (const item of items) {
      // Stop if we've already saved 200 items
      if (totalSavedCount >= MAX_SAVE_COUNT) {
        break;
      }

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

      // Only save items published after last execution
      if (!shouldSaveItem(rssItem.pubDate, lastExecutionTime)) {
        continue;
      }

      const docId = createDocId(rssItem);
      const docRef = doc(rssCollection, docId);

      // Remove undefined fields before saving to Firestore
      const dataToSave = {
        title: rssItem.title,
        pubDate: Timestamp.fromDate(rssItem.pubDate),
        description: rssItem.description,
        author: rssItem.author,
        categories: rssItem.categories,
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

    // Delete old items to maintain max 200 items in Firestore
    const allDocsSnapshot = await getDocs(rssCollection);
    const allDocs = allDocsSnapshot.docs
      .map(d => ({ id: d.id, pubDate: d.data().pubDate }))
      .sort((a, b) => b.pubDate.toDate().getTime() - a.pubDate.toDate().getTime());

    if (allDocs.length > MAX_SAVE_COUNT) {
      const docsToDelete = allDocs.slice(MAX_SAVE_COUNT);
      let deleteBatch = writeBatch(db);
      let deleteCount = 0;

      for (const docItem of docsToDelete) {
        deleteBatch.delete(doc(rssCollection, docItem.id));
        deleteCount++;

        if (deleteCount >= BATCH_SIZE) {
          await deleteBatch.commit();
          deleteBatch = writeBatch(db);
          deleteCount = 0;
        }
      }

      if (deleteCount > 0) {
        await deleteBatch.commit();
      }

      console.log(`${collectionName}: ${docsToDelete.length}件の古いRSSアイテムを削除しました`);
    }

    // Save current execution time for this specific collection
    await saveExecutionTime(collectionName);

    console.log(`${collectionName}: ${totalSavedCount}件のRSSアイテムをFirestoreに保存しました`);
    return totalSavedCount;
  } catch (error) {
    console.error("RSSの取得または保存に失敗しました:", error);
    throw error;
  }
}
