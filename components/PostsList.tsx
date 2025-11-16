"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Latest50PostsResponse, Post } from "@/functions/types"
import { getLatest50Posts } from "@/functions/posts"
import { Button } from "@/components/ui/button"

export default function PostsLists() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getLatest50Posts()
        setPosts(response.posts)
      } catch (error) {
        console.error("投稿の取得に失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  if (posts.length === 0) {
    return <div className="text-center py-8 text-gray-500">投稿がまだありません</div>
  }

  return (
    <div className="space-y-4 w-full">
      {posts.map((post, index) => (
        <PostItem key={index} post={post} />
      ))}
    </div>
  )
}

const PostItem = ({ post }: { post: Post }) => {
  const [liked, setLiked] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.authorName}</CardTitle>
        <CardDescription>
          {post.category} • {new Date(post.createdAt).toLocaleString("ja-JP")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.category === "授業" && (
          <div className="text-sm text-gray-600 mt-4 space-y-1">
            {post.targetYear && <div>対象学年: {post.targetYear}年生</div>}
            {post.targetMajor && <div>対象類: {post.targetMajor}</div>}
            {post.targetClass && <div>対象クラス: {post.targetClass}</div>}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          onClick={() => setLiked(!liked)}
        >
          👍 {post.likeCount + (liked ? 1 : 0)}
        </Button>
      </CardFooter>
    </Card>
  )
}