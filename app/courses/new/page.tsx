"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCourse } from "@/lib/courses-api"
import { getCachedUser, getCachedToken } from "@/lib/data-helpers"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_link: "",
    thumbnail_url: "",
    price: "",
    duration: "",
    category: "",
    tags: "",
    status: "draft" as "draft" | "published" | "archived",
  })

  useEffect(() => {
    // Check for user on mount and when localStorage changes
    const checkUser = () => {
      const cachedUser = getCachedUser()
      const token = getCachedToken()
      if (cachedUser && token) {
        setUser(cachedUser)
      } else {
        setUser(null)
      }
    }

    checkUser()
    
    // Listen for storage changes (e.g., when user logs in/out in another tab)
    window.addEventListener("storage", checkUser)
    return () => window.removeEventListener("storage", checkUser)
  }, [])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert>
          <AlertDescription>
            You need to be signed in to create a course.{" "}
            <Link href="/" className="underline">
              Go to homepage
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const courseData = {
        title: formData.title,
        description: formData.description || undefined,
        video_link: formData.video_link || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        category: formData.category || undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : undefined,
        status: formData.status,
        owner_id: user.id || user.memberId,
      }

      // Check if we have a token before making the request
      const token = getCachedToken()
      if (!token) {
        setError("No authentication token found. Please log in again.")
        return
      }

      const course = await createCourse(courseData)
      router.push(`/courses/${course.id}`)
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to create course"
      setError(errorMessage)
      console.error("Error creating course:", err)
      
      // If it's an auth error, suggest re-login
      if (errorMessage.includes("Authentication") || errorMessage.includes("401")) {
        setError(`${errorMessage}. Please try logging out and logging back in.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-6">
        <Link href="/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          <CardDescription>
            Fill in the details to create a new course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Course title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Course description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video_link">Video Link</Label>
                <Input
                  id="video_link"
                  name="video_link"
                  type="url"
                  value={formData.video_link}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  name="thumbnail_url"
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Web Development"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="javascript, react, nextjs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Course"}
              </Button>
              <Link href="/courses">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

