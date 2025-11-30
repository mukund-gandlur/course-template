import { NextRequest, NextResponse } from "next/server"
import { init } from "@memberstack/admin"

const secretKey = process.env.MEMBERSTACK_SECRET_KEY
const appId = process.env.MEMBERSTACK_APP_ID

export async function POST(request: NextRequest) {
  try {
    if (!secretKey) {
      return NextResponse.json(
        { error: "MEMBERSTACK_SECRET_KEY not configured" },
        { status: 500 }
      )
    }

    let token: string | null = null

    // Try to get token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // Try to get token from request body
      const body = await request.json().catch(() => ({}))
      token = body.token || null
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token not provided" },
        { status: 401 }
      )
    }

    // Initialize Memberstack Admin
    const admin = init(secretKey)

    // Verify token
    const verification = await admin.verifyToken({ token })

    if (!verification || !verification.id) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    // Return member data
    return NextResponse.json({
      member: {
        id: verification.id,
        memberId: verification.id, // Alias for compatibility
        type: verification.type,
      },
      appId: appId,
    })
  } catch (error: any) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      { error: error?.message || "Token verification failed" },
      { status: 401 }
    )
  }
}

