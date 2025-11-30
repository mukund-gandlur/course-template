import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/memberstack-api"
import { listCourses, createCourse } from "@/lib/memberstack-admin"

const secretKey = process.env.MEMBERSTACK_SECRET_KEY
const appId = process.env.MEMBERSTACK_APP_ID

export async function GET(request: NextRequest) {
  try {
    if (!secretKey || !appId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    let member = null
    if (token) {
      member = await verifyToken(token)
    }

    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("owner_id")

    if (ownerId && !member) {
      return NextResponse.json(
        { error: "Authentication required to filter by owner_id" },
        { status: 401 }
      )
    }

    try {
      const courses = await listCourses(ownerId || undefined)

      const processedCourses = courses.map((course: any) => {
        const price = course.priceCents ? course.priceCents / 100 : (course.price || 0)
        const status = course.status || "published"
        
        return {
          ...course,
          price,
          status,
        }
      })

      let filteredCourses = processedCourses
      if (!member && !ownerId) {
        filteredCourses = processedCourses.filter((course: any) => course.status === "published")
      }

      return NextResponse.json({ courses: filteredCourses })
    } catch (error: any) {
      return NextResponse.json({
        courses: [],
        message: "Unable to fetch courses via Admin REST API.",
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to list courses" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, video_link, thumbnail_url, price, status, duration, category, tags } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    try {
      const courseData = {
        title,
        description: description || "",
        owner_id: member.id || member.memberId,
        video_link: video_link || "",
        thumbnail_url: thumbnail_url || "",
        priceCents: price ? Math.round(price * 100) : 0,
        status: status || "draft",
        duration: duration || 0,
        category: category || "",
        tags: tags || [],
      }

      const course = await createCourse(courseData)
      
      const responseCourse = {
        ...course,
        price: course.priceCents ? course.priceCents / 100 : course.price,
      }

      return NextResponse.json({ course: responseCourse }, { status: 201 })
    } catch (error: any) {
      if (error?.message?.includes("table") || error?.message?.includes("not found")) {
        return NextResponse.json(
          {
            error: "Courses table not found. Please create the table first.",
          },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create course" },
      { status: 500 }
    )
  }
}

