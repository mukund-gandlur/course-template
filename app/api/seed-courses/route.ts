import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/memberstack-api"
import { getSeededImageUrl } from "@/lib/image-helpers"

const secretKey = process.env.MEMBERSTACK_SECRET_KEY
const appId = process.env.MEMBERSTACK_APP_ID
const ADMIN_API_BASE = "https://admin.memberstack.com"

export async function GET() {
  return NextResponse.json({
    message: "Course seeding endpoint",
    description: "POST to this endpoint to create sample courses",
    usage: "POST /api/seed-courses",
    parameters: {
      count: "Optional query parameter to specify number of courses (default: 50, max: 200)",
    },
    example: "POST /api/seed-courses?count=50",
    requiresAuth: true,
  })
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

    const { searchParams } = new URL(request.url)
    const body = await request.json().catch(() => ({}))
    const countParam = searchParams.get("count") || body.count || "50"
    const count = Math.min(Math.max(parseInt(countParam, 10) || 50, 1), 200)
    const courseTemplates = [
      {
        title: "Introduction to Web Development",
        description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript.",
        category: "Web Development",
        tags: ["html", "css", "javascript", "beginner"],
        price: 49.99,
        duration: 120,
      },
      {
        title: "Advanced React Patterns",
        description: "Master advanced React patterns and best practices for building scalable applications.",
        category: "Web Development",
        tags: ["react", "javascript", "advanced"],
        price: 79.99,
        duration: 180,
      },
      {
        title: "Full-Stack Next.js Development",
        description: "Build complete full-stack applications with Next.js, React, and TypeScript.",
        category: "Web Development",
        tags: ["nextjs", "react", "typescript", "fullstack"],
        price: 99.99,
        duration: 240,
      },
      {
        title: "Python for Data Science",
        description: "Learn Python programming and data analysis with pandas, numpy, and matplotlib.",
        category: "Data Science",
        tags: ["python", "data-science", "pandas", "numpy"],
        price: 89.99,
        duration: 200,
      },
      {
        title: "Machine Learning Fundamentals",
        description: "Introduction to machine learning algorithms and their applications.",
        category: "Data Science",
        tags: ["machine-learning", "ai", "python", "scikit-learn"],
        price: 129.99,
        duration: 300,
      },
      {
        title: "UI/UX Design Principles",
        description: "Master the principles of user interface and user experience design.",
        category: "Design",
        tags: ["design", "ui", "ux", "figma"],
        price: 69.99,
        duration: 150,
      },
      {
        title: "Mobile App Development with React Native",
        description: "Build cross-platform mobile apps using React Native.",
        category: "Mobile Development",
        tags: ["react-native", "mobile", "javascript"],
        price: 94.99,
        duration: 220,
      },
      {
        title: "Docker and Kubernetes",
        description: "Learn containerization and orchestration with Docker and Kubernetes.",
        category: "DevOps",
        tags: ["docker", "kubernetes", "devops", "containers"],
        price: 109.99,
        duration: 250,
      },
      {
        title: "GraphQL API Development",
        description: "Build efficient APIs with GraphQL and Apollo Server.",
        category: "Backend Development",
        tags: ["graphql", "api", "apollo", "nodejs"],
        price: 84.99,
        duration: 190,
      },
      {
        title: "TypeScript Mastery",
        description: "Master TypeScript for building type-safe applications.",
        category: "Programming",
        tags: ["typescript", "javascript", "programming"],
        price: 74.99,
        duration: 160,
      },
    ]

    const courses = []
    const now = new Date().toISOString()
    const memberId = member.id || member.memberId

    for (let i = 0; i < count; i++) {
      const template = courseTemplates[i % courseTemplates.length]
      const variation = Math.floor(i / courseTemplates.length)

      const course = {
        title: variation > 0 ? `${template.title} - Part ${variation + 1}` : template.title,
        description: template.description,
        owner_id: memberId,
        video_link: `https://example.com/video/course-${i + 1}`,
              thumbnail_url: getSeededImageUrl(`course-${i + 1}`, 800, 450),
        price: template.price + (variation * 10),
        status: i < Math.floor(count * 0.8) ? "published" : "draft",
        duration: template.duration + (variation * 20),
        category: template.category,
        tags: template.tags,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: now,
      }

      courses.push(course)
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    const endpoint = `${ADMIN_API_BASE}/v2/data-tables/courses/records`

    const batchSize = 5
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (course, index) => {
          try {
            const courseData = {
              title: course.title,
              description: course.description,
              owner_id: course.owner_id,
              video_link: course.video_link,
              thumbnail_url: course.thumbnail_url,
              priceCents: Math.round(course.price * 100),
              status: course.status,
              duration: course.duration,
              category: course.category,
              tags: course.tags,
              created_at: course.created_at,
              updated_at: course.updated_at,
            }

            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "X-API-KEY": secretKey!,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                data: courseData,
              }),
            })

            if (!response.ok) {
              const error = await response.json().catch(() => ({ error: response.statusText }))
              throw new Error(error.error || error.message || `Failed to create course: ${response.statusText}`)
            }

            successCount++
          } catch (error: any) {
            errorCount++
            errors.push(`Course ${i + index + 1}: ${error.message}`)
          }
        })
      )

      if (i + batchSize < courses.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${successCount} out of ${count} courses successfully`,
      requested: count,
      created: successCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to seed courses" },
      { status: 500 }
    )
  }
}

