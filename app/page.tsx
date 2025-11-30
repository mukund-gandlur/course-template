"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { runMigration, seedCourses } from "@/lib/courses-api"
import { getCachedUser } from "@/lib/data-helpers"
import { getCourseThumbnail } from "@/lib/image-helpers"
import { BookOpen, ArrowRight, Database, Plus, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Course {
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

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [user, setUser] = useState<any>(null)
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

      const data: Course[] = courses.map((course: any) => {
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
      
      const published = data.filter((c) => !c.status || c.status === "published")
      setCourses(published.slice(0, 6)) // Show max 6 courses
    } catch (err: any) {
      if (err?.message?.includes("migration") || err?.message?.includes("table")) {
        setError("Courses table not set up. Create the table first.")
      } else {
        setError(err?.message || "Failed to load courses")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMigration = async () => {
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
      setError(err?.message || "Migration failed")
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Memberstack Course Boilerplate</h1>
        <p className="text-xl text-muted-foreground mb-8">
          A complete course offering platform built with Next.js and Memberstack
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/courses">
            <Button size="lg">
              <BookOpen className="h-5 w-5 mr-2" />
              Browse Courses
            </Button>
          </Link>
          {!user && (
            <Link href="/courses">
              <Button size="lg" variant="outline">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && error.includes("migration") && (
        <Alert className="mb-8 max-w-2xl mx-auto">
          <Database className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              onClick={handleMigration}
              disabled={migrating}
              className="ml-4"
            >
              {migrating ? "Running..." : "Run Migration"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {courses.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Link href="/courses">
              <Button variant="ghost">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          {courses.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses available</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by creating the data tables and adding some sample courses.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleMigration}
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
                          const result = await seedCourses(50)
                          alert(`Successfully created ${result.created} courses!`)
                          await loadCourses()
                        } catch (err: any) {
                          setError(err?.message || "Failed to seed courses. Make sure you're logged in.")
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
                  </div>
                  {!user && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Sign in to add sample courses
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-200">
                    <img
                      src={getCourseThumbnail(course.thumbnail_url, course.id)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    {course.category && (
                      <CardDescription>{course.category}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description || "No description available"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Easy Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Run a single API call to set up your database tables and start creating courses.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Full CRUD API</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Complete REST API for creating, reading, updating, and deleting courses with authentication.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Memberstack Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Built-in authentication and user management powered by Memberstack.
            </p>
          </CardContent>
        </Card>
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

