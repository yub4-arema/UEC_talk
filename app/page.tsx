import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center">
      <Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">統計</TabsTrigger>
    <TabsTrigger value="password">タイムライン</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Make changes to your account here.</TabsContent>
  <TabsContent value="password">Change your password here.</TabsContent>
</Tabs>
    </div>
  )
}