"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { deleteCourse, type Course } from "@/lib/courses-api"
import { getCachedUser } from "@/lib/data-helpers"
import { getCourseThumbnail } from "@/lib/image-helpers"
import { Video, Clock, DollarSign, Edit, Trash2, ArrowLeft, PlayCircle, BookOpen } from "lucide-react"

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [lessons, setLessons] = useState<any[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)

  useEffect(() => {
    const cachedUser = getCachedUser()
    setUser(cachedUser)
    loadCourse()
  }, [courseId])

  useEffect(() => {
    if (course?.id) {
      loadLessons()
    }
  }, [course?.id])

  const loadCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/courses/${courseId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Course not found")
          return
        }
        const errorData = await response.json().catch(() => ({ error: "Failed to load course" }))
        throw new Error(errorData.error || "Failed to load course")
      }
      
      const data = await response.json()
      setCourse(data.course)
    } catch (err: any) {
      setError(err?.message || "Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  const loadLessons = async () => {
    try {
      setLoadingLessons(true)
      const response = await fetch(`/api/lessons?course_id=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setLessons(data.lessons || [])
      }
    } catch (err: any) {
      // Silently fail - lessons are optional
    } finally {
      setLoadingLessons(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course?")) {
      return
    }

    try {
      setDeleting(true)
      await deleteCourse(courseId)
      router.push("/courses")
    } catch (err: any) {
      setError(err?.message || "Failed to delete course")
      console.error("Error deleting course:", err)
    } finally {
      setDeleting(false)
    }
  }

  const isOwner = user && course && (user.id === course.owner_id || user.memberId === course.owner_id)

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free"
    return `$${price.toFixed(2)}`
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A"
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !course) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/courses">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!course) {
    return null
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-200">
              <img
                src={getCourseThumbnail(course.thumbnail_url, course.id, 1200, 675)}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                  {course.category && (
                    <CardDescription className="text-base">{course.category}</CardDescription>
                  )}
                </div>
                <Badge variant={course.status === "published" ? "default" : "secondary"}>
                  {course.status || "draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-lg text-muted-foreground mb-6">
                  {course.description || "No description available"}
                </p>

                {loadingLessons ? (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Lessons
                    </h3>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  </div>
                ) : lessons.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Lessons ({lessons.length})
                    </h3>
                    <div className="space-y-2">
                      {lessons.map((lesson, index) => (
                        <div
                          key={lesson.id || index}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                            {lesson.order || index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{lesson.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {lesson.duration && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(lesson.duration)}
                                </span>
                              )}
                              {lesson.video_url && (
                                <span className="text-xs text-purple-600 flex items-center gap-1">
                                  <PlayCircle className="h-3 w-3" />
                                  Video
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : course.lessons ? (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Lessons
                    </h3>
                    <div className="space-y-2">
                      {course.lessons.split(',').map((lessonTitle, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{lessonTitle.trim()}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {course.video_link && lessons.length === 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Course Video</h3>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={course.video_link}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={course.title}
                      />
                    </div>
                  </div>
                )}

                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {course.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessons.length > 0 && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Lessons:</strong> {lessons.length}
                  </span>
                </div>
              )}
              {course.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Duration:</strong> {formatDuration(course.duration)}
                  </span>
                </div>
              )}
              {course.price !== undefined && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Price:</strong> {formatPrice(course.price)}
                  </span>
                </div>
              )}
              {course.category && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{course.category}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/courses/${courseId}/edit`} className="block">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Course
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Course"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

