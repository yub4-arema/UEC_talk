'use server'

import { NextResponse } from "next/server";
import { FetchAndSaveRssToFirestore } from "@/functions/api/FetchAndSaveRssToFirestore";
import { fetchAllRssFeeds } from "@/functions/api/fetchAllRssFeeds";

export async function POST(request: Request) {
  let body: { rssUrl?: string; collectionName?: string; fetchAll?: boolean };

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "無効なJSONです" }, { status: 400 });
  }

  // 複数フィードを一括取得する場合
  if (body?.fetchAll) {
    try {
      const result = await fetchAllRssFeeds();
      return NextResponse.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error("RSS一括取得エラー:", errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }

  // 個別フィードを取得する場合
  const rssUrl = body?.rssUrl;
  const collectionName = body?.collectionName || "rss_items";
  
  if (!rssUrl) {
    return NextResponse.json({ error: "rssUrlパラメータが必要です" }, { status: 400 });
  }

  try {
    const savedCount = await FetchAndSaveRssToFirestore(rssUrl, collectionName);
    return NextResponse.json({ savedCount, collectionName });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    console.error("RSS APIエラー:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
