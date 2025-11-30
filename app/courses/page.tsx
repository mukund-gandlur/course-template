"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCachedUser } from "@/lib/data-helpers"
import { getCourseThumbnail } from "@/lib/image-helpers"
import { runMigration, seedCourses } from "@/lib/courses-api"
import { Search, Star, Filter, X, SlidersHorizontal, Database, Plus, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { COURSE_CATEGORIES } from "@/lib/categories"

export interface Course {
  id?: string
  title: string
  description?: string
  owner_id: string
  video_link?: string
  thumbnail_url?: string
  price?: number
  status?: "draft" | "published" | "archived"
  duration?: number
  category?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<number>(0)
  const [migrating, setMigrating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    const cachedUser = getCachedUser()
    setUser(cachedUser)
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const apiResponse = await fetch("/api/courses", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: "Failed to fetch courses" }))
        throw new Error(errorData.error || `API request failed: ${apiResponse.statusText}`)
      }

      const apiData = await apiResponse.json()
      const courses = apiData.courses || []

      if (courses.length === 0) {
        setCourses([])
        return
      }
      const formattedCourses = courses.map((course: any) => {
        return {
          id: course.id,
          title: course.title || "",
          description: course.description || "",
          owner_id: course.owner_id || "",
          video_link: course.video_link || "",
          thumbnail_url: course.thumbnail_url || course.thumbnailUrl || "",
          price: course.priceCents ? course.priceCents / 100 : (course.price || 0),
          status: course.status || "published",
          duration: course.duration,
          category: course.category,
          tags: course.tags,
          created_at: course.created_at,
          updated_at: course.updated_at,
        }
      })

      let filteredCourses = formattedCourses
      if (!user) {
        filteredCourses = formattedCourses.filter((c: Course) => c.status === "published")
      } else {
        filteredCourses = formattedCourses.filter(
          (c: Course) => c.status === "published" || c.owner_id === user.id || c.owner_id === user.memberId
        )
      }

      setCourses(filteredCourses)
      setFilteredCourses(filteredCourses)
    } catch (err: any) {
      setError(err?.message || "Failed to load courses")
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

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

  // Combine hardcoded categories with categories from courses
  const courseCategories = new Set(courses.map(c => c.category).filter(Boolean))
  const allAvailableCategories = [...COURSE_CATEGORIES, ...Array.from(courseCategories)]
  const uniqueCategories = Array.from(new Set(allAvailableCategories))
  
  const allCategories = ["all", ...uniqueCategories] as string[]
  const categoryCounts = allCategories.reduce((acc, cat) => {
    if (cat === "all") {
      acc[cat] = courses.length
    } else {
      acc[cat] = courses.filter(c => c.category === cat).length
    }
    return acc
  }, {} as Record<string, number>)
  
  // Show hardcoded categories first, then others (max 6 total + "All Courses")
  const hardcodedInList = COURSE_CATEGORIES.filter(cat => allCategories.includes(cat)).slice(0, 6)
  const otherCategories = uniqueCategories.filter(cat => !COURSE_CATEGORIES.includes(cat as any)).slice(0, 6 - hardcodedInList.length)
  const categories = ["all", ...hardcodedInList, ...otherCategories].slice(0, 7) // Max 6 categories + "All Courses"

  useEffect(() => {
    let filtered = [...courses]

    if (selectedCategory !== "all") {
      filtered = filtered.filter(c => c.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        c =>
          c.title?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.category?.toLowerCase().includes(query) ||
          c.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (priceFilter === "free") {
      filtered = filtered.filter(c => !c.price || c.price === 0)
    } else if (priceFilter === "paid") {
      filtered = filtered.filter(c => c.price && c.price > 0)
    }

    if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => Math.random() - 0.5)
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
    }

    setFilteredCourses(filtered)
  }, [searchQuery, selectedCategory, sortBy, priceFilter, ratingFilter, courses])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSortBy("newest")
    setPriceFilter("all")
    setRatingFilter(0)
  }

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || sortBy !== "newest" || priceFilter !== "all"

  const getCourseBadge = (index: number) => {
    const badges = ["Bestseller", "Popular", "New", "Featured"]
    const badgeColors = [
      "bg-gray-700",
      "bg-blue-600",
      "bg-purple-600",
      "bg-indigo-600",
    ]
    return {
      text: badges[index % badges.length],
      color: badgeColors[index % badgeColors.length],
    }
  }

  const getCourseGradient = (index: number) => {
    const gradients = [
      "from-gray-400 to-gray-600",
      "from-blue-300 to-blue-500",
      "from-purple-300 to-purple-500",
      "from-indigo-300 to-indigo-500",
      "from-slate-400 to-slate-600",
      "from-gray-500 to-gray-700",
    ]
    return gradients[index % gradients.length]
  }

  const getMockInstructor = (index: number) => {
    const instructors = ["Sarah Johnson", "Mike Chen", "Emma Davis", "John Smith", "Lisa Wang", "David Brown"]
    return instructors[index % instructors.length]
  }

  const getMockRating = (index: number) => {
    const ratings = [4.8, 4.9, 4.7, 4.6, 4.5, 4.4]
    const reviews = [234, 189, 156, 298, 145, 201]
    return {
      rating: ratings[index % ratings.length],
      reviews: reviews[index % reviews.length],
    }
  }

  const getMockLessons = (index: number) => {
    const lessons = [24, 18, 32, 28, 21, 26]
    return lessons[index % lessons.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar Skeleton */}
            <aside className="w-72 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-5 w-16 mb-2" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
                <Skeleton className="h-5 w-20 mb-2" />
                <div className="space-y-1">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1">
              <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-6 w-96" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Price</h3>
                <div className="space-y-2">
                  {["all", "free", "paid"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setPriceFilter(option)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        priceFilter === option
                          ? "bg-purple-600 text-white font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="capitalize">{option === "all" ? "All Prices" : option}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => {
                    if (!category) return null
                    const count = categoryCounts[category] || 0
                    const isSelected = selectedCategory === category
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? "bg-purple-600 text-white font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="capitalize">{category === "all" ? "All Courses" : category}</span>
                        <span className={`ml-2 ${isSelected ? "text-purple-100" : "text-gray-400"}`}>
                          ({count})
                        </span>
                      </button>
                    )
                  })}
                  {allCategories.length > 6 && (
                    <p className="text-xs text-gray-500 mt-2 px-3">
                      +{allCategories.length - 6} more categories
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Courses</h1>
              <p className="text-gray-600 text-lg">Discover courses from world-class instructors.</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {filteredCourses.length === 0 && courses.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="max-w-md mx-auto">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                    <p className="text-muted-foreground mb-6">
                      Get started by creating the data tables and adding some sample courses.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={async () => {
                          try {
                            setMigrating(true)
                            setError(null)
                            const result = await runMigration()
                            setMigrationResult(result)
                            if (result.success) {
                              await loadCourses()
                            } else {
                              setMigrationDialogOpen(true)
                            }
                          } catch (err: any) {
                            setError(err?.message || "Failed to create tables")
                          } finally {
                            setMigrating(false)
                          }
                        }}
                        disabled={migrating}
                        variant="outline"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        {migrating ? "Checking Tables..." : "Create Data Tables"}
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            setSeeding(true)
                            setError(null)
                            
                            // Check if user is logged in
                            if (!user) {
                              throw new Error("Please sign in first to add sample courses.")
                            }
                            
                            // Check if token exists
                            let token = localStorage.getItem("memberstack_token")
                            
                            // If no token in localStorage, try to get it from SDK
                            if (!token) {
                              try {
                                const { getToken } = await import("@/lib/memberstack-client")
                                token = await getToken()
                              } catch (e) {
                                console.warn("Could not get token from SDK:", e)
                              }
                            }
                            
                            if (!token) {
                              throw new Error("Authentication token not found. Please sign out and sign in again. The token should be stored automatically after login.")
                            }
                            
                            const result = await seedCourses(50)
                            alert(`Successfully created ${result.created} courses!`)
                            await loadCourses()
                          } catch (err: any) {
                            const errorMessage = err?.message || "Failed to seed courses. Make sure you're logged in."
                            setError(errorMessage)
                            console.error("Seed courses error:", err)
                          } finally {
                            setSeeding(false)
                          }
                        }}
                        disabled={seeding || !user}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {seeding ? "Adding Courses..." : "Add Sample Courses"}
                      </Button>
                      {user && (
                        <Link href="/courses/new">
                          <Button variant="outline">
                            Create Course
                          </Button>
                        </Link>
                      )}
                    </div>
                    {!user && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Sign in to add sample courses or create your own
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : filteredCourses.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground mb-4">No courses match your filters.</p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course, index) => {
                  const badge = getCourseBadge(index)
                  const gradient = getCourseGradient(index)
                  const instructor = getMockInstructor(index)
                  const rating = getMockRating(index)
                  const lessons = getMockLessons(index)
                  const originalPrice = course.price ? course.price * 1.8 : 0
                  const discount = course.price ? Math.round(((originalPrice - course.price) / originalPrice) * 100) : 0

                  const thumbnailUrl = getCourseThumbnail(course.thumbnail_url, course.id)

                  return (
                    <Link key={course.id} href={`/courses/${course.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                        <div className="h-40 relative overflow-hidden bg-gray-200">
                          <img
                            src={thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to gradient if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              const parent = target.parentElement
                              if (parent) {
                                parent.className = `h-40 bg-gradient-to-br ${gradient} relative`
                              }
                            }}
                          />
                          <Badge className={`absolute top-2 left-2 ${badge.color} text-white border-0 text-xs`}>
                            {badge.text}
                          </Badge>
                          <div className="absolute bottom-2 left-2 right-2 text-white text-xs drop-shadow-lg">
                            {lessons} lessons
                          </div>
                        </div>

                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-bold line-clamp-2 text-gray-900">
                            {course.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="pt-0 space-y-3">
                          <div className="flex items-center justify-between">
                            {course.price && course.price > 0 ? (
                              <span className="text-xl font-bold text-gray-900">
                                {formatPrice(course.price)}
                              </span>
                            ) : (
                              <span className="text-xl font-bold text-gray-900">Free</span>
                            )}
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">{rating.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{instructor}</span>
                            {course.category && (
                              <Badge variant="outline" className="text-xs">
                                {course.category}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Migration Dialog */}
      <Dialog open={migrationDialogOpen} onOpenChange={setMigrationDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Courses Data Table</DialogTitle>
            <DialogDescription>
              {migrationResult?.message || "The courses data table needs to be created in your Memberstack dashboard."}
            </DialogDescription>
          </DialogHeader>

          {migrationResult?.tableSchema && (
            <div className="space-y-6 mt-4">
              {/* Table Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Table Configuration</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span>
                    <code className="bg-white px-2 py-1 rounded">{migrationResult.tableSchema.name}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Key:</span>
                    <code className="bg-white px-2 py-1 rounded">{migrationResult.tableSchema.key}</code>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium block mb-2">Access Rules:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Create: <code className="bg-white px-1 rounded">{migrationResult.tableSchema.accessRules.createRule}</code></div>
                      <div>Read: <code className="bg-white px-1 rounded">{migrationResult.tableSchema.accessRules.readRule}</code></div>
                      <div>Update: <code className="bg-white px-1 rounded">{migrationResult.tableSchema.accessRules.updateRule}</code></div>
                      <div>Delete: <code className="bg-white px-1 rounded">{migrationResult.tableSchema.accessRules.deleteRule}</code></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields Table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Fields</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Field Key</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Type</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Required</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {migrationResult.tableSchema.fields.map((field: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{field.key}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(field.key)
                                  setCopiedField(field.key)
                                  setTimeout(() => setCopiedField(null), 2000)
                                }}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {copiedField === field.key ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-2">{field.name}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{field.type}</Badge>
                          </td>
                          <td className="px-4 py-2">
                            {field.required ? (
                              <Badge variant="destructive">Required</Badge>
                            ) : (
                              <Badge variant="secondary">Optional</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{field.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              {migrationResult?.instructions && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Step-by-Step Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                    {migrationResult.instructions.map((instruction: string, index: number) => (
                      <li key={index} className="leading-relaxed">{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    if (migrationResult?.dashboardUrl) {
                      window.open(migrationResult.dashboardUrl, "_blank")
                    }
                  }}
                  className="flex-1"
                >
                  Open Memberstack Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMigrationDialogOpen(false)
                    loadCourses()
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {!migrationResult?.tableSchema && migrationResult?.success && (
            <div className="mt-4">
              <Alert>
                <AlertDescription>{migrationResult.message}</AlertDescription>
              </Alert>
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  setMigrationDialogOpen(false)
                  loadCourses()
                }}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

