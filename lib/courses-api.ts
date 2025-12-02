
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

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
  lessons?: string // Comma-separated list of lesson titles or lesson data
}

async function getAuthHeaders(): Promise<HeadersInit> {
  if (typeof window === "undefined") {
    return {
      "Content-Type": "application/json",
    }
  }
  
  let token = localStorage.getItem("memberstack_token")
  
  if (!token) {
    try {
      const { getToken } = await import("@/lib/memberstack-client")
      token = await getToken()
    } catch (error) {
      // Token not available
    }
  }
  
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function listCourses(ownerId?: string): Promise<Course[]> {
  const url = new URL(`${BASE_URL}/api/courses`)
  if (ownerId) {
    url.searchParams.set("owner_id", ownerId)
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: await getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch courses" }))
    throw new Error(error.error || "Failed to fetch courses")
  }

  const data = await response.json()
  return data.courses || []
}

export async function getCourse(courseId: string): Promise<Course> {
  const response = await fetch(`${BASE_URL}/api/courses/${courseId}`, {
    method: "GET",
    headers: await getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Course not found" }))
    throw new Error(error.error || "Course not found")
  }

  const data = await response.json()
  return data.course
}

export async function createCourse(course: Omit<Course, "id" | "created_at" | "updated_at">): Promise<Course> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/api/courses`, {
    method: "POST",
    headers,
    body: JSON.stringify(course),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create course" }))
    throw new Error(error.error || "Failed to create course")
  }

  const data = await response.json()
  return data.course
}

export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
  const response = await fetch(`${BASE_URL}/api/courses/${courseId}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update course" }))
    throw new Error(error.error || "Failed to update course")
  }

  const data = await response.json()
  return data.course
}

export async function deleteCourse(courseId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/courses/${courseId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete course" }))
    throw new Error(error.error || "Failed to delete course")
  }
}

export async function runMigration(): Promise<{
  success: boolean
  message: string
  tableExists?: boolean
  tableCreated?: boolean
  needsCreation?: boolean
  tableSchema?: {
    name: string
    key: string
    accessRules: {
      createRule: string
      readRule: string
      updateRule: string
      deleteRule: string
    }
    fields: Array<{
      key: string
      name: string
      type: string
      required: boolean
      description: string
    }>
  }
  instructions?: string[]
  dashboardUrl?: string
  appId?: string
}> {
  const response = await fetch(`${BASE_URL}/api/migrate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Migration failed" }))
    throw new Error(error.error || "Migration failed")
  }

  return await response.json()
}

export async function seedCourses(count: number = 50): Promise<{ success: boolean; created: number; errors: number; requested: number; message: string; errorDetails?: string[] }> {
  const url = new URL(`${BASE_URL}/api/seed-courses`)
  if (count !== 50) {
    url.searchParams.set("count", count.toString())
  }

  const headers = await getAuthHeaders()
  
  // Check if Authorization header is present
  const authHeader = headers instanceof Headers 
    ? headers.get("Authorization")
    : (headers as Record<string, string>)["Authorization"]
  
  if (!authHeader) {
    throw new Error("Authentication required. Please sign in first. The token may have expired or not been stored correctly.")
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to seed courses" }))
    
    if (response.status === 401) {
      // Clear potentially invalid token
      if (typeof window !== "undefined") {
        localStorage.removeItem("memberstack_token")
      }
      throw new Error("Authentication failed. Please sign in again. The token may have expired.")
    }
    
    throw new Error(error.error || `Failed to seed courses: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

