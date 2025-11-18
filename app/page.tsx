"use client";
import { Button } from "@/components/ui/button"
import Talk from "@/components/talk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Post from "@/components/post";
import PostsLists from "@/components/PostsList";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

export default function Home() {
  const [postings, setPostings] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center p-4 gap-8">
      <h1 className="text-3xl font-bold">25_bot</h1>
      <Tabs defaultValue="posts" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">投稿</TabsTrigger>
          <TabsTrigger value="talk">bot質問</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">最新の投稿</h2>
            <PostsLists />
            {postings || <Tooltip>
              <TooltipTrigger asChild className="fixed bottom-8 right-8">
                <Button variant="outline" onClick={()=>setPostings(!postings)}>投稿</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>新しい情報をここで共有しよう</p>
              </TooltipContent>
            </Tooltip>}
          </div>
          {postings && 
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="w-full max-w-2xl bg-white rounded-lg p-6 shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={()=>setPostings(!postings)}>閉じる</Button>
              </div>
              <Post ChangePosting={() => setPostings(!postings)} />
            </div>
          </div>}
        </TabsContent>
        <TabsContent value="talk" className="flex justify-center">
          <Talk />
        </TabsContent>
      </Tabs>
    </div>
  );
}
