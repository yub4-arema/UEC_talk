"use client"
import { useState } from "react"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/conmbobox"
import type { PostCategory } from "@/functions/types"
import { makePost } from "@/functions/posts"

const Post = () => {
  const [content, setContent] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [category, setCategory] = useState<PostCategory>("授業")
  const [targetYear, setTargetYear] = useState<number | null>(null)
  const [targetMajor, setTargetMajor] = useState<"I類" | "II類" | "III類" | null>(null)
  const [targetClass, setTargetClass] = useState<string>("")

  const categoryOptions: ComboboxOption[] = [
    { value: "授業", label: "授業" },
    { value: "その他", label: "その他" },
  ]

  const yearOptions: ComboboxOption[] = [
    { value: "", label: "指定なし" },
    { value: "1", label: "1年生" },
    { value: "2", label: "2年生" },
    { value: "3", label: "3年生" },
    { value: "4", label: "4年生" },
  ]

  const majorOptions: ComboboxOption[] = [
    { value: "", label: "指定なし" },
    { value: "I類", label: "I類" },
    { value: "II類", label: "II類" },
    { value: "III類", label: "III類" },
  ]

  const handleSubmit = async () => {
    if (!content.trim() || !authorName.trim()) {
      alert("投稿者名と投稿内容は必須です");
      return;
    }

    try {
      await makePost({
        content,
        authorName,
        category,
        targetYear,
        targetMajor,
        targetClass: targetClass || null,
        createdAt: new Date(),
        likeCount: 0,
      });
      
      // 投稿成功後、フォームをリセット
      setContent("");
      setAuthorName("名無しのりさじゅう");
      setCategory("授業");
      setTargetYear(null);
      setTargetMajor(null);
      setTargetClass("");
      alert("投稿しました！");
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("投稿に失敗しました");
    }
  }

  return (
    <>
      <FieldSet>
        <FieldLegend>新規投稿</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>カテゴリ</FieldLabel>
            <RadioGroup value={category} onValueChange={(value) => setCategory(value as PostCategory)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="授業" id="category-class" />
                <FieldLabel htmlFor="category-class">授業</FieldLabel>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="その他" id="category-other" />
                <FieldLabel htmlFor="category-other">その他</FieldLabel>
              </div>
            </RadioGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="authorName">投稿者名</FieldLabel>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="名前を入力"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="content">投稿内容</FieldLabel>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="投稿内容を入力"
              rows={4}
            />
          </Field>

          
          {category === "授業" && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Field>
                  <Combobox
                    options={yearOptions}
                    placeholder="指定なし"
                    searchPlaceholder="学年を検索..."
                    value={targetYear?.toString() ?? ""}
                    onValueChange={(value) => setTargetYear(value ? Number(value) : null)}
                    label="学年"
                    showLabel={true}
                    width="w-[100px]"
                  />
                </Field>

                <Field>
                  <Combobox
                    options={majorOptions}
                    placeholder="指定なし"
                    searchPlaceholder="類を検索..."
                    value={targetMajor ?? ""}
                    onValueChange={(value) => setTargetMajor(value ? (value as "I類" | "II類" | "III類") : null)}
                    label="類"
                    showLabel={true}
                    width="w-[100px]"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="targetClass">対象クラス（任意）</FieldLabel>
                <Input
                  id="targetClass"
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  placeholder="例: Aクラス,1クラス"
                />
              </Field>
            </div>
          )}

          <Button onClick={handleSubmit}>投稿する</Button>
        </FieldGroup>
      </FieldSet>
    </>
  )
}

export default Post
