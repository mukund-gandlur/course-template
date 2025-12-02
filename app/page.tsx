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
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)

  useEffect(() => {
    const cachedUser = getCachedUser()
    setUser(cachedUser)
    loadCourses()
    checkTablesExist()
  }, [])

  const checkTablesExist = async () => {
    try {
      const result = await runMigration()
      setTablesExist(result.tableExists === true)
    } catch (err) {
      // If check fails, assume tables don't exist
      setTablesExist(false)
    }
  }

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
      setTablesExist(result.tableExists === true)
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
              <CardContent className="py-16">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-start gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-semibold text-sm flex items-center justify-center mt-0.5">1</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground mb-2">
                          Create course tables to continue.
                  </p>
                    <Button
                      onClick={handleMigration}
                          disabled={migrating || tablesExist === true}
                      variant="outline"
                          size="sm"
                          className={tablesExist === true ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Database className="h-4 w-4 mr-2" />
                          {migrating ? "Checking Tables..." : tablesExist === true ? "Tables Already Created" : "Create Data Tables"}
                    </Button>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm flex items-center justify-center mt-0.5">2</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground mb-2">
                          Add sample courses (optional).
                        </p>
                    <Button
                      onClick={async () => {
                        try {
                          setSeeding(true)
                          setError(null)
                          const result = await seedCourses(50)
                          if (result.errors > 0) {
                            const errorMsg = result.errorDetails 
                              ? `Created ${result.created} courses. ${result.errors} failed.\n\nFirst errors:\n${result.errorDetails.slice(0, 3).join('\n')}`
                              : `Created ${result.created} courses. ${result.errors} failed.`
                            alert(errorMsg)
                          } else {
                            alert(`Successfully created ${result.created} courses!`)
                          }
                          await loadCourses()
                        } catch (err: any) {
                          setError(err?.message || "Failed to seed courses. Make sure you're logged in.")
                        } finally {
                          setSeeding(false)
                        }
                      }}
                      disabled={seeding || !user}
                          variant="outline"
                          size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {seeding ? "Adding Courses..." : "Add Sample Courses"}
                    </Button>
                      </div>
                    </div>
                    </div>
                    <div className="flex-shrink-0 hidden md:block">
                      <Database className="h-48 w-48 text-gray-300" />
                    </div>
                  </div>
                  {!user && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
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

      {courses.length === 0 && (
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
      )}

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

              {/* MCP Instructions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Create Table Using MCP (Recommended)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  You can create the table programmatically using Memberstack MCP. Copy the prompt below and use it with your MCP client:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-xs text-gray-100 whitespace-pre-wrap font-mono overflow-x-auto">
{`create the courses table using mcp, on courses-boilerplate app sandbox

Table configuration:
- Name: Courses
- Key: courses
- Create Rule: AUTHENTICATED
- Read Rule: PUBLIC
- Update Rule: AUTHENTICATED_OWN
- Delete Rule: AUTHENTICATED_OWN

Fields to create:
1. title (TEXT, required) - Course title
2. owner_id (MEMBER_REFERENCE, required) - Owner of the course
3. description (TEXT, optional) - Course description
4. video_link (TEXT, optional) - Video link
5. thumbnail_url (TEXT, optional) - Thumbnail URL
6. priceCents (NUMBER, optional) - Price in cents
7. status (TEXT, optional) - Status: draft, published, or archived
8. duration (NUMBER, optional) - Duration in minutes
9. category (TEXT, optional) - Course category
10. tags (TEXT, optional) - Tags (comma-separated)
11. lessons (TEXT, optional) - Lessons data
12. created_at (DATE, optional) - Creation date
13. updated_at (DATE, optional) - Last update date`}
                  </pre>
                  <button
                    onClick={() => {
                      const prompt = `create the courses table using mcp, on courses-boilerplate app sandbox

Table configuration:
- Name: Courses
- Key: courses
- Create Rule: AUTHENTICATED
- Read Rule: PUBLIC
- Update Rule: AUTHENTICATED_OWN
- Delete Rule: AUTHENTICATED_OWN

Fields to create:
1. title (TEXT, required) - Course title
2. owner_id (MEMBER_REFERENCE, required) - Owner of the course
3. description (TEXT, optional) - Course description
4. video_link (TEXT, optional) - Video link
5. thumbnail_url (TEXT, optional) - Thumbnail URL
6. priceCents (NUMBER, optional) - Price in cents
7. status (TEXT, optional) - Status: draft, published, or archived
8. duration (NUMBER, optional) - Duration in minutes
9. category (TEXT, optional) - Course category
10. tags (TEXT, optional) - Tags (comma-separated)
11. lessons (TEXT, optional) - Lessons data
12. created_at (DATE, optional) - Creation date
13. updated_at (DATE, optional) - Last update date`
                      navigator.clipboard.writeText(prompt)
                      setCopiedField('mcp-prompt')
                      setTimeout(() => setCopiedField(null), 2000)
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                    title="Copy prompt"
                  >
                    {copiedField === 'mcp-prompt' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  After creating the table with MCP, click "Close" and then click "Create Data Tables" again to verify.
                </p>
              </div>

              {/* Instructions */}
              {migrationResult?.instructions && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Or Create Table Manually in Dashboard</h3>
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

