import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { TalkLog } from "../types";

export const saveTalkLog = async (log: TalkLog): Promise<void> => {
  try {
    const talkLogsCollection = collection(db, "talkLogs");
    await addDoc(talkLogsCollection, {
      question: log.question,
      answer: log.answer,
      prompt: log.prompt ?? null,
      model: log.model ?? null,
      requestId: log.requestId ?? null,
      usage: log.usage ?? null,
      success: log.success,
      error: log.error || null,
      errorStack: log.errorStack || null,
      createdAt: new Date(),
    });
    console.log("✅ 会話ログをFirestoreに保存しました");
  } catch (error) {
    console.error("❌ 会話ログの保存に失敗:", error);
  }
};
