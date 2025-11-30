/**
 * Memberstack Admin API helpers
 * Server-side only functions for managing data tables and courses
 * Uses the Admin REST API for data table operations
 */

import { init } from "@memberstack/admin"

const secretKey = process.env.MEMBERSTACK_SECRET_KEY
const appId = process.env.MEMBERSTACK_APP_ID
const ADMIN_API_BASE = "https://admin.memberstack.com"

let adminInstance: any = null

export function getAdminInstance() {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  if (!adminInstance) {
    adminInstance = init(secretKey)
  }

  return adminInstance
}

/**
 * Make a REST API call to the Admin API
 */
async function adminRestCall(endpoint: string, options: RequestInit = {}) {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  const url = `${ADMIN_API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "X-API-KEY": secretKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || error.message || `API request failed: ${response.statusText}`)
  }

  return await response.json()
}

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
  priceCents?: number
  lessons?: string
}

export interface Lesson {
  id?: string
  course_id: string
  title: string
  description?: string
  video_url?: string
  duration?: number
  order: number
  created_at?: string
  updated_at?: string
}

/**
 * Create a course in the data table
 * Uses Admin REST API v2: POST /v2/data-tables/:tableKey/records
 * Documentation: https://developers.memberstack.com/admin-rest-api/data-tables
 */
export async function createCourse(course: Omit<Course, "id" | "created_at" | "updated_at">): Promise<Course> {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  const now = new Date().toISOString()
  const courseData = {
    ...course,
    created_at: now,
    updated_at: now,
  }

  try {
    // Use v2 create endpoint: POST /v2/data-tables/:tableKey/records
    const endpoint = `${ADMIN_API_BASE}/v2/data-tables/courses/records`
    
    const headers: HeadersInit = {
      "X-API-KEY": secretKey,
      "Content-Type": "application/json",
    }
    
    // Add app ID header if available
    if (appId) {
      headers["X-APP-ID"] = appId
    }
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: courseData,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.message || `Failed to create course: ${response.statusText}`)
    }

    const result = await response.json()
    // Response format: { data: { id, ...recordData } }
    const record = result.data || result
    
    return {
      id: record.id,
      ...courseData,
      ...(record.data || record),
    } as Course
  } catch (error: any) {
    throw new Error(`Failed to create course: ${error?.message || "Unknown error"}`)
  }
}

/**
 * Get a course by ID
 * Uses Admin REST API v2: POST /v2/data-tables/:tableKey/records/query with findUnique
 * Documentation: https://developers.memberstack.com/admin-rest-api/data-tables
 */
export async function getCourse(courseId: string): Promise<Course | null> {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  try {
    // Use query endpoint with findUnique (more reliable than direct GET)
    const queryEndpoint = `${ADMIN_API_BASE}/v2/data-tables/courses/records/query`
    
    const headers: HeadersInit = {
      "X-API-KEY": secretKey,
      "Content-Type": "application/json",
    }
    
    // Add app ID header if available
    if (appId) {
      headers["X-APP-ID"] = appId
    }
    
    console.log("Fetching course with findUnique:", {
      endpoint: queryEndpoint,
      courseId: courseId,
      appId: appId,
    })
    
    // Try findUnique first
    const findUniqueResponse = await fetch(queryEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: {
          findUnique: {
            where: {
              id: courseId,
            },
          },
        },
      }),
    })

    console.log("findUnique response status:", findUniqueResponse.status)

    if (findUniqueResponse.ok) {
      const result = await findUniqueResponse.json()
      console.log("findUnique response:", result)
      
      // Response structure: { data: { record: { id, data: {...} } } }
      if (result.data?.record) {
        const record = result.data.record
        const recordData = record.data || {}
        console.log("Parsed record:", { 
          id: record.id, 
          recordDataKeys: Object.keys(recordData),
          recordDataType: typeof recordData,
        })
        
        // Combine id with the data fields, ensuring id is preserved
        const course = {
          ...recordData,
          id: record.id, // Set id last to ensure it's not overwritten
        } as Course
        
        console.log("Returning course:", { id: course.id, hasId: !!course.id })
        return course
      } else if (result.data) {
        // Fallback: direct data structure
        const record = result.data
        const recordData = record.data || record
        return {
          id: record.id || recordData.id,
          ...recordData,
        } as Course
      }
    } else {
      const errorText = await findUniqueResponse.text()
      console.log("findUnique error response:", errorText)
    }

    // Fallback: Use findMany with where clause to filter by ID
    console.log("Trying findMany as fallback")
    const findManyResponse = await fetch(queryEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: {
          findMany: {
            where: {
              id: {
                equals: courseId,
              },
            },
            take: 1,
          },
        },
      }),
    })

    if (findManyResponse.ok) {
      const result = await findManyResponse.json()
      console.log("findMany response:", result)
      
      let records: any[] = []
      if (Array.isArray(result)) {
        records = result
      } else if (result.data?.records && Array.isArray(result.data.records)) {
        records = result.data.records
      } else if (result.data && Array.isArray(result.data)) {
        records = result.data
      } else if (result.records && Array.isArray(result.records)) {
        records = result.records
      }

      if (records.length > 0) {
        const record = records[0]
        const recordData = record.data || record
        return {
          id: record.id || recordData.id,
          ...recordData,
        } as Course
      }
    } else {
      const errorText = await findManyResponse.text()
      console.log("findMany error response:", errorText)
    }

    // Last resort: Try direct GET endpoint
    const directEndpoint = `${ADMIN_API_BASE}/v2/data-tables/courses/records/${courseId}`
    console.log("Trying direct GET as last resort:", directEndpoint)
    
    const directResponse = await fetch(directEndpoint, {
      method: "GET",
      headers,
    })

    if (directResponse.status === 404) {
      console.log("Course not found (404) from all methods:", courseId)
      return null
    }

    if (!directResponse.ok) {
      const errorText = await directResponse.text()
      let error: any = {}
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { error: errorText || directResponse.statusText }
      }
      
      if (directResponse.status === 404 || error.message?.includes("not found") || error.error?.includes("not found")) {
        return null
      }
      
      throw new Error(error.error || error.message || `Failed to get course: ${directResponse.statusText}`)
    }

    const result = await directResponse.json()
    const record = result.data || result
    
    if (!record || !record.id) {
      return null
    }

    return {
      id: record.id,
      ...(record.data || record),
    } as Course
  } catch (error: any) {
    console.error("Get course exception:", {
      message: error?.message,
      courseId: courseId,
      stack: error?.stack,
    })
    throw new Error(`Failed to get course: ${error?.message || "Unknown error"}`)
  }
}

/**
 * List all courses, optionally filtered by owner
 * Uses Admin REST API v2: https://admin.memberstack.com/v2/data-tables/:tableKey/records/query
 * Documentation: https://developers.memberstack.com/admin-rest-api/data-tables
 */
export async function listCourses(ownerId?: string): Promise<Course[]> {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  try {
    // Use v2 query endpoint: POST /v2/data-tables/:tableKey/records/query
    // Try with table key first, fallback to table ID if needed
    const tableKey = "courses" // Using table key as per Memberstack docs
      const endpoint = `${ADMIN_API_BASE}/v2/data-tables/${tableKey}/records/query`
      
      let allRecords: any[] = []
      let cursor: string | null = null
      let hasMore = true
      const pageSize = 100

      // Fetch all pages
      while (hasMore) {
        // Build query with findMany
        const queryBody: any = {
          query: {
            findMany: {
              take: pageSize,
            },
          },
        }

        // Add cursor for pagination if we have one
        // The cursor should be the internalOrder value, and might need to be a number
        if (cursor) {
          const cursorNum = parseInt(cursor, 10)
          if (!isNaN(cursorNum)) {
            queryBody.query.findMany.after = cursorNum
          } else {
            queryBody.query.findMany.after = cursor
          }
        }

        // Add where filter if ownerId is provided
        if (ownerId) {
          queryBody.query.findMany.where = {
            owner_id: {
              equals: ownerId,
            },
          }
        }

        const headers: HeadersInit = {
          "X-API-KEY": secretKey,
          "Content-Type": "application/json",
        }
        
        // Add app ID header if available (helps ensure correct app context)
        if (appId) {
          headers["X-APP-ID"] = appId
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(queryBody),
        })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      
      let records: any[] = []
      let pagination: any = null
      
      if (Array.isArray(data)) {
        records = data
        hasMore = false
      } else if (data.data?.records && Array.isArray(data.data.records)) {
        records = data.data.records
        pagination = data.data.pagination
      } else if (data.data && Array.isArray(data.data)) {
        records = data.data
        hasMore = false
      } else if (data.records && Array.isArray(data.records)) {
        records = data.records
        hasMore = false
      } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        records = [data.data]
        hasMore = false
      } else {
        hasMore = false
        break
      }
      
      if (!Array.isArray(records)) {
        hasMore = false
        break
      }

      allRecords = allRecords.concat(records)

      if (pagination) {
        hasMore = pagination.hasMore === true
        cursor = pagination.endCursor?.toString() || null
      } else {
        hasMore = records.length === pageSize
        if (records.length > 0) {
          const lastRecord = records[records.length - 1]
          cursor = lastRecord.internalOrder?.toString() || null
        }
      }

      if (records.length === 0) {
        hasMore = false
      }

      if (allRecords.length > 1000) {
        hasMore = false
      }
    }
    
    return allRecords.map((record: any) => {
      const recordData = record.data || record
      return {
        id: record.id || recordData.id,
        ...recordData,
      }
    })
  } catch (error: any) {
    throw new Error(`Failed to list courses: ${error?.message || "Unknown error"}`)
  }
}

/**
 * Update a course
 * Uses Admin REST API v2: PUT /v2/data-tables/:tableKey/records/:recordId
 * Documentation: https://developers.memberstack.com/admin-rest-api/data-tables
 */
export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  try {
    // Use v2 update endpoint: PUT /v2/data-tables/:tableKey/records/:recordId
    const endpoint = `${ADMIN_API_BASE}/v2/data-tables/courses/records/${courseId}`
    
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "X-API-KEY": secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: updateData,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.message || `Failed to update course: ${response.statusText}`)
    }

    const result = await response.json()
    // Response format: { data: { id, ...recordData } }
    const record = result.data || result
    return {
      id: record.id,
      ...(record.data || record),
    } as Course
  } catch (error: any) {
    throw new Error(`Failed to update course: ${error?.message || "Unknown error"}`)
  }
}

/**
 * Delete a course
 * Uses Admin REST API v2: DELETE /v2/data-tables/:tableKey/records/:recordId
 * Documentation: https://developers.memberstack.com/admin-rest-api/data-tables
 */
export async function deleteCourse(courseId: string): Promise<boolean> {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  try {
    // Use v2 delete endpoint: DELETE /v2/data-tables/:tableKey/records/:recordId
    const endpoint = `${ADMIN_API_BASE}/v2/data-tables/courses/records/${courseId}`
    
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "X-API-KEY": secretKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.message || `Failed to delete course: ${response.statusText}`)
    }

    return true
  } catch (error: any) {
    throw new Error(`Failed to delete course: ${error?.message || "Unknown error"}`)
  }
}

/**
 * List lessons for a course
 * Uses Admin REST API v2: POST /v2/data-tables/:tableKey/records/query with findMany
 */
export async function listLessons(courseId: string): Promise<Lesson[]> {
  if (!secretKey) {
    throw new Error("MEMBERSTACK_SECRET_KEY not configured")
  }

  try {
    const endpoint = `${ADMIN_API_BASE}/v2/data-tables/lessons/records/query`
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-API-KEY": secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          findMany: {
            where: {
              course_id: {
                equals: courseId,
              },
            },
            orderBy: {
              order: "asc",
            },
            take: 1000,
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.message || `Failed to fetch lessons: ${response.statusText}`)
    }

    const data = await response.json()
    let records: any[] = []
    
    if (Array.isArray(data)) {
      records = data
    } else if (data.data?.records && Array.isArray(data.data.records)) {
      records = data.data.records
    } else if (data.data && Array.isArray(data.data)) {
      records = data.data
    } else if (data.records && Array.isArray(data.records)) {
      records = data.records
    }
    
    return records.map((record: any) => {
      const recordData = record.data || record
      return {
        id: record.id || recordData.id,
        ...recordData,
      }
    })
  } catch (error: any) {
    throw new Error(`Failed to list lessons: ${error?.message || "Unknown error"}`)
  }
}

