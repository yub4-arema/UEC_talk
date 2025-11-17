'use client'
import { useState } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"

import TalkAi from "@/functions/talk"
export default function Talk() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setResponse("");
      try {
      const res = await TalkAi(question);
      if (res.text) {
        setResponse(res.text);
        setQuestion("");
      } else if (res.error) {
        // Display the error reason from the server so 'Talk' can show it.
        // Keep a short friendly message but include the underlying reason for debugging.
        const stack = (res as any).stack;
        setResponse(`${res.error}${stack ? `\n\n詳細スタック:\n${stack}` : ''}`);
      }
    } catch (error) {
      setResponse(`Googleが何かバグったようです: ${error instanceof Error ? error.message : 'えーっと...エラーです。'}`);
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="grid w-full max-w-md gap-4">
    <InputGroup>
      <InputGroupTextarea
        id="textarea-code-32"
        placeholder="質問を入力してください"
        className="min-h-[200px]"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <InputGroupAddon align="block-end" className="border-t">
        <InputGroupText>AIは程よく信じましょう</InputGroupText>
        {loading ? <InputGroupButton size="sm" className="ml-auto" variant="default" disabled>
            <IoHourglassOutline />
        </InputGroupButton> :
        <InputGroupButton size="sm" className="ml-auto" variant="default" onClick={handleAsk} >
            <CiPaperplane className="m-0"/>
        </InputGroupButton>}
        
      </InputGroupAddon>
      <InputGroupAddon align="block-start" className="border-b">
        <InputGroupText className="font-mono font-medium">
          UEC_AI
        </InputGroupText>
        <InputGroupButton className="ml-auto" size="icon-xs">
          
        </InputGroupButton>
        <InputGroupButton variant="ghost" size="icon-xs">
          
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
    {loading ? (
      <Textarea placeholder="読み込み中..." value="回答中です。お茶でも飲みながらまったりお待ちください。"readOnly />
    ) : (
      <Textarea placeholder="まずは質問" value={response} readOnly />
    )}
      
  </div>

);
}
