import Talk from "@/components/talk"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <>
      <Tabs defaultValue="UEC" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="posts">Posts</TabsTrigger>
    <TabsTrigger value="talk">Talk</TabsTrigger>
  </TabsList>
  <TabsContent value="posts">Make changes to your account here.</TabsContent>
  <TabsContent value="talk">
    <Talk />
  </TabsContent>
</Tabs>
    </>
  )
}