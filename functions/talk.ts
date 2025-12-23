'use server'

import Groq from "groq-sdk";
import { buildTalkDataContext, refreshRssFeeds } from "./talk/fetchers";
import { saveTalkLog } from "./talk/logging";
import { buildTalkPrompt } from "./talk/prompt";
import type { TalkLog } from "./types";

const groq = new Groq();

const getJstNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

const TalkAi = async (question: string, talkLogs: Array<{ question: string; answer: string }>) => {
  let prompt = "";
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("⚠️ GROQ_API_KEY環境変数が設定されていません");
      return {
        text: "エラー。作者の財布が尽きたようです。（APIキーが未設定）",
        success: false,
        error: "GROQ_API_KEY is not configured",
      };
    }

    refreshRssFeeds();

    const { postsText, studentRssText, officialRssText } = await buildTalkDataContext();
    const jstNow = getJstNow();
    prompt = buildTalkPrompt({
      question,
      talkLogs: talkLogs || [],
      postsText,
      studentRssText,
      officialRssText,
      jstNow,
    });

    console.log("🔄 Groq Chat APIに接続中...");

    const completion = await groq.chat.completions.create({
      model: "groq/compound-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? "";

    const successLog: TalkLog = {
      question,
      answer: text,
      prompt,
      success: true,
      createdAt: new Date(),
    };
    await saveTalkLog(successLog);

    return {
      text,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("AI API エラー:", errorMessage, errorStack);

    const errorLog: TalkLog = {
      question,
      answer: "",
      prompt,
      success: false,
      error: errorMessage,
      errorStack,
      createdAt: new Date(),
    };
    await saveTalkLog(errorLog);

    const fallbackText = "エラーですね...気が向いたら報告してくれると嬉しいです。";

    return {
      text: fallbackText,
      success: false,
      error: "AI API Error",
    };
  }
};

export default TalkAi;
