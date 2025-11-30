import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/memberstack-api"
import { getCourse, updateCourse, deleteCourse } from "@/lib/memberstack-admin"

const secretKey = process.env.MEMBERSTACK_SECRET_KEY
const appId = process.env.MEMBERSTACK_APP_ID
const ADMIN_API_BASE = "https://admin.memberstack.com"

/**
 * GET /api/courses/[id] - Get a single course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!secretKey || !appId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { id } = await params
    const courseId = id

    // Get auth token (optional for public courses)
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    // Verify token if provided (optional)
    let member = null
    if (token) {
      member = await verifyToken(token)
      // If token is invalid, continue without auth (public access)
    }

    try {
      console.log("Fetching course with ID:", courseId)
      const course = await getCourse(courseId)
      console.log("Course result:", course ? "Found" : "Not found", course?.id)

      if (!course) {
        console.log("Course not found, returning 404")
        return NextResponse.json(
          { error: "Course not found", courseId },
          { status: 404 }
        )
      }

      // Check if course is published or user is owner
      // Note: The test app courses might not have status or owner_id fields
      const isPublished = course.status === "published" || course.status === undefined
      const isOwner = member && course.owner_id && (member.id === course.owner_id || member.memberId === course.owner_id)

      console.log("Access check:", {
        status: course.status,
        isPublished,
        hasOwner: !!course.owner_id,
        isOwner,
        memberId: member?.id || member?.memberId,
        courseOwnerId: course.owner_id,
      })

      if (!isPublished && !isOwner) {
        console.log("Access denied - course not published and user is not owner")
        return NextResponse.json(
          { error: "Course not found or access denied" },
          { status: 404 }
        )
      }

      console.log("Access granted, returning course")

      const price = course.priceCents ? course.priceCents / 100 : (course.price || 0)
      const responseCourse = {
        ...course,
        price,
      }

      return NextResponse.json({ course: responseCourse })
    } catch (error: any) {
      if (error?.message?.includes("not found")) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error("Get course error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to get course" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/courses/[id] - Update a course
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!secretKey || !appId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const member = await verifyToken(token)
    if (!member) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const { id } = await params
    const courseId = id
    const body = await request.json()
    const updates = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    // Remove id, created_at from updates (these shouldn't be changed)
    delete updates.id
    delete updates.created_at

    try {
      const existingCourse = await getCourse(courseId)

      if (!existingCourse) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        )
      }

      const memberId = member.id || member.memberId

      if (existingCourse.owner_id !== memberId) {
        return NextResponse.json(
          { error: "You don't have permission to update this course" },
          { status: 403 }
        )
      }

      if (updates.price) {
        updates.priceCents = Math.round(updates.price * 100)
        delete updates.price
      }

      const course = await updateCourse(courseId, updates)
      
      const price = course.priceCents ? course.priceCents / 100 : (course.price || 0)
      const responseCourse = {
        ...course,
        price,
      }

      return NextResponse.json({ course: responseCourse })
    } catch (error: any) {
      throw error
    }
  } catch (error: any) {
    console.error("Update course error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update course" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/courses/[id] - Delete a course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!secretKey || !appId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const member = await verifyToken(token)
    if (!member) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const { id } = await params
    const courseId = id
    try {
      const existingCourse = await getCourse(courseId)

      if (!existingCourse) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        )
      }

      const memberId = member.id || member.memberId

      if (existingCourse.owner_id !== memberId) {
        return NextResponse.json(
          { error: "You don't have permission to delete this course" },
          { status: 403 }
        )
      }

      await deleteCourse(courseId)

      return NextResponse.json({ success: true, message: "Course deleted" })
    } catch (error: any) {
      throw error
    }
  } catch (error: any) {
    console.error("Delete course error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete course" },
      { status: 500 }
    )
  }
}

