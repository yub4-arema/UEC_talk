import Talk from "@/components/talk"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Post from "@/components/post"
import PostsLists from "@/components/PostsList"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-4 gap-8">
      <h1 className="text-3xl font-bold">UEC コミュニティ</h1>
      <Tabs defaultValue="posts" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">投稿</TabsTrigger>
          <TabsTrigger value="talk">AI相談</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="space-y-6">
          <div className="border rounded-lg p-6">
            <Post />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">最新の投稿</h2>
            <PostsLists />
          </div>
        </TabsContent>
        <TabsContent value="talk" className="flex justify-center">
          <Talk />
        </TabsContent>
      </Tabs>
    </div>
  )
}