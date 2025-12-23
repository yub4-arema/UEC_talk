'use client'
import {useState } from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { CiPaperplane } from "react-icons/ci";
import { IoHourglassOutline } from "react-icons/io5";
import { Textarea } from "@/components/ui/textarea"
import TalkAi from "@/functions/talk";

export default function Talk() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [talkLogs, setTalkLogs] = useState<Array<{question: string; answer: string}>>([]);
 
  const callRssApi = async () => {
    const rssUrl = process.env.NEXT_PUBLIC_RSS_URL;
    if (!rssUrl) {
      console.warn("RSS URLが設定されていません");
      return;
    }

    try {
      const response = await fetch("/api/rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        savedCount?: number;
        error?: string;
      };

      if (!response.ok) {
        console.warn("RSS保存APIが失敗しました", payload.error || response.statusText);
        return;
      }

      console.log(`RSS保存: ${payload.savedCount ?? 0}件`);
    } catch (error) {
      console.error("RSS保存APIの呼び出しに失敗しました", error);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setResponse("");
    try {
      // RSS更新APIを呼び出し（サーバー側で環境変数を処理）
      await callRssApi();
      
      const res = await TalkAi(question, talkLogs);
      console.log("会話履歴は:", talkLogs);
      if (res.text) {
        setResponse(res.text);
        setQuestion("");
      } else if (res.error) {
        setResponse(res.error);
      }
    } catch (error) {
      setResponse(`Googleが何かバグったようです: ${error instanceof Error ? error.message : 'えーっと...エラーです。'}`);
    } finally {
      setLoading(false);
      setTalkLogs((prevLogs) => [...prevLogs, { question, answer: response }]);
    }
  };

return (
  <div className="grid w-full max-w-md gap-4">
    <InputGroup>
      <InputGroupTextarea
        id="textarea-code-32"
        placeholder={`質問を入力してください\n(直近の投稿やtwitterの直近のポストを参考に回答します。)`}
        className="min-h-[200px]"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <InputGroupAddon align="block-end" className="border-t">
        <InputGroupText>25_botは程よく信じましょう</InputGroupText>
        {loading ? <InputGroupButton size="sm" className="ml-auto" variant="default" disabled>
            <IoHourglassOutline />
        </InputGroupButton> :
        <InputGroupButton size="sm" className="ml-auto" variant="default" onClick={handleAsk} >
            <CiPaperplane className="m-0"/>
        </InputGroupButton>}
        
      </InputGroupAddon>
      <InputGroupAddon align="block-start" className="border-b">
        <InputGroupText className="font-mono font-medium">
          25_bot
        </InputGroupText>
        <InputGroupButton className="ml-auto" size="icon-xs">
          
        </InputGroupButton>
        <InputGroupButton variant="ghost" size="icon-xs">
          
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
    {loading ? (
      <Textarea placeholder="読み込み中..." value="回答中です。お茶でも飲みながらまったりお待ちください。" className="min-h-[200px]" readOnly />
    ) : (
      <Textarea placeholder="まずは質問" value={response} className="min-h-[200px]" readOnly />
    )}
    {talkLogs.length > 0 && (<div className="space-y-4">
      {[...talkLogs].reverse().map((log, index) => (
        index===1 ? 
        <Textarea placeholder="質問はここ" id="message" value={log.question} className="min-h-[120px]" readOnly /> : (
        <div key={index} >
           <Textarea placeholder="質問はここ" id="message" value={log.question} className="min-h-[120px] mb-4" readOnly />
           <Textarea placeholder="回答はここ" id="message" value={log.answer} className="min-h-[120px]" readOnly />
        </div>
      )))}
    </div>)}
  </div>

);
}
