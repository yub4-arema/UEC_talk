'use server'

import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || ""});

const TalkAi = async (question: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      text: text,
      success: true
    };
  } catch (error) {
    console.error('AI API エラー:', error);
    return {
      text: "エラー。作者の財布が尽きたようです。",
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}

export default TalkAi;