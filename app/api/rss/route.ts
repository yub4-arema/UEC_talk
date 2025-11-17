'use server'

import { NextResponse } from "next/server";
import { FetchAndSaveRssToFirestore } from "@/functions/api/FetchAndSaveRssToFirestore";

export async function POST(request: Request) {
  let body: { rssUrl?: string };

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "無効なJSONです" }, { status: 400 });
  }

  const rssUrl = body?.rssUrl;
  if (!rssUrl) {
    return NextResponse.json({ error: "rssUrlパラメータが必要です" }, { status: 400 });
  }

  try {
    const savedCount = await FetchAndSaveRssToFirestore(rssUrl);
    return NextResponse.json({ savedCount });
  } catch (error) {
    console.error("RSS APIエラー:", error);
    return NextResponse.json(
      { error: "RSSの取得または保存に失敗しました" },
      { status: 500 }
    );
  }
}
