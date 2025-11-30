import { NextRequest, NextResponse } from "next/server"

const secretKey = process.env.MEMBERSTACK_SECRET_KEY
const appId = process.env.MEMBERSTACK_APP_ID
const ADMIN_API_BASE = "https://admin.memberstack.com"

/**
 * Migration endpoint to check and create the courses data table
 * This checks if the table exists and provides setup instructions if needed
 */
export async function POST(request: NextRequest) {
  try {
    if (!secretKey) {
      return NextResponse.json(
        { error: "MEMBERSTACK_SECRET_KEY not configured" },
        { status: 500 }
      )
    }

    if (!appId) {
      return NextResponse.json(
        { error: "MEMBERSTACK_APP_ID not configured" },
        { status: 500 }
      )
    }

    // Check if courses table exists by trying to query it
    const checkEndpoint = `${ADMIN_API_BASE}/v2/data-tables/courses/records/query`
    
    try {
      const checkResponse = await fetch(checkEndpoint, {
        method: "POST",
        headers: {
          "X-API-KEY": secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            findMany: {
              take: 1,
            },
          },
        }),
      })

      if (checkResponse.ok) {
        // Table exists!
        const result = await checkResponse.json()
        return NextResponse.json({
          success: true,
          message: "Courses data table exists and is ready to use!",
          tableExists: true,
          tableCreated: false,
        })
      } else if (checkResponse.status === 404) {
        // Table doesn't exist - return response with detailed schema information
        // Note: Memberstack Admin REST API doesn't support creating tables programmatically
        const tableSchema = {
          name: "Courses",
          key: "courses",
          accessRules: {
            createRule: "ADMIN_ONLY",
            readRule: "PUBLIC",
            updateRule: "ADMIN_ONLY",
            deleteRule: "ADMIN_ONLY",
          },
          fields: [
            {
              key: "title",
              name: "Title",
              type: "TEXT",
              required: true,
              description: "Course title",
            },
            {
              key: "description",
              name: "Description",
              type: "TEXT",
              required: true,
              description: "Course description",
            },
            {
              key: "priceCents",
              name: "Price (cents)",
              type: "NUMBER",
              required: true,
              description: "Price in cents (e.g., 9999 = $99.99)",
            },
            {
              key: "thumbnailUrl",
              name: "Thumbnail URL",
              type: "TEXT",
              required: false,
              description: "URL to course thumbnail image",
            },
            {
              key: "lessons",
              name: "Lessons",
              type: "TEXT",
              required: false,
              description: "Comma-separated list of lesson titles",
            },
          ],
        }

        return NextResponse.json({
          success: false,
          message: "Courses data table not found. Please create it manually in your Memberstack dashboard.",
          tableExists: false,
          tableCreated: false,
          needsCreation: true,
          tableSchema: tableSchema,
          instructions: [
            "1. Go to https://app.memberstack.com",
            "2. Sign in to your Memberstack account (create an account if you don't have one)",
            "3. Select your app (current app ID: " + appId + ")",
            "4. Navigate to 'Tables (Beta)' in the sidebar",
            "5. Click 'Create Table'",
            "6. Configure the table:",
            "   - Name: 'Courses'",
            "   - Key: 'courses' (lowercase, must match exactly)",
            "   - Access Rules:",
            "     * Create: ADMIN_ONLY",
            "     * Read: PUBLIC (so courses can be viewed)",
            "     * Update: ADMIN_ONLY",
            "     * Delete: ADMIN_ONLY",
            "7. Add the fields listed below with their exact types and requirements",
            "8. Click 'Create'",
            "9. Come back and click 'Create Data Tables' again to verify",
          ],
          dashboardUrl: "https://app.memberstack.com",
          appId: appId,
        })
      } else {
        // Some other error
        const errorText = await checkResponse.text()
        throw new Error(`Failed to check table: ${checkResponse.status} ${errorText}`)
      }
    } catch (checkError: any) {
      // If the error suggests table doesn't exist, provide instructions with schema
      if (checkError?.message?.includes("404") || checkError?.message?.includes("not found")) {
        const tableSchema = {
          name: "Courses",
          key: "courses",
          accessRules: {
            createRule: "ADMIN_ONLY",
            readRule: "PUBLIC",
            updateRule: "ADMIN_ONLY",
            deleteRule: "ADMIN_ONLY",
          },
          fields: [
            {
              key: "title",
              name: "Title",
              type: "TEXT",
              required: true,
              description: "Course title",
            },
            {
              key: "description",
              name: "Description",
              type: "TEXT",
              required: true,
              description: "Course description",
            },
            {
              key: "priceCents",
              name: "Price (cents)",
              type: "NUMBER",
              required: true,
              description: "Price in cents (e.g., 9999 = $99.99)",
            },
            {
              key: "thumbnailUrl",
              name: "Thumbnail URL",
              type: "TEXT",
              required: false,
              description: "URL to course thumbnail image",
            },
            {
              key: "lessons",
              name: "Lessons",
              type: "TEXT",
              required: false,
              description: "Comma-separated list of lesson titles",
            },
          ],
        }

        return NextResponse.json({
          success: false,
          message: "Courses data table not found. Please create it manually in your Memberstack dashboard.",
          tableExists: false,
          tableCreated: false,
          needsCreation: true,
          tableSchema: tableSchema,
          instructions: [
            "1. Go to https://app.memberstack.com",
            "2. Sign in to your Memberstack account (create an account if you don't have one)",
            "3. Select your app (current app ID: " + appId + ")",
            "4. Navigate to 'Tables (Beta)' in the sidebar",
            "5. Click 'Create Table'",
            "6. Configure the table:",
            "   - Name: 'Courses'",
            "   - Key: 'courses' (lowercase, must match exactly)",
            "   - Access Rules:",
            "     * Create: ADMIN_ONLY",
            "     * Read: PUBLIC (so courses can be viewed)",
            "     * Update: ADMIN_ONLY",
            "     * Delete: ADMIN_ONLY",
            "7. Add the fields listed below with their exact types and requirements",
            "8. Click 'Create'",
            "9. Come back and click 'Create Data Tables' again to verify",
          ],
          dashboardUrl: "https://app.memberstack.com",
          appId: appId,
        })
      }
      throw checkError
    }
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Migration check failed",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// Allow GET for easy testing
export async function GET() {
  return NextResponse.json({
    message: "Course migration endpoint",
    description: "POST to this endpoint to create the courses data table",
    usage: "curl -X POST http://localhost:3000/api/migrate",
  })
}

