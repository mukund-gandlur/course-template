import { NextRequest, NextResponse } from "next/server"
import { listLessons } from "@/lib/memberstack-admin"

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

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("course_id")

    if (!courseId) {
      return NextResponse.json(
        { error: "course_id parameter is required" },
        { status: 400 }
      )
    }

    try {
      const lessons = await listLessons(courseId)
      return NextResponse.json({ lessons })
    } catch (error: any) {
      return NextResponse.json({
        lessons: [],
        message: "Unable to fetch lessons. Lessons table may not exist yet.",
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to list lessons" },
      { status: 500 }
    )
  }
}

