/**
 * Memberstack API helpers
 * Call internal API routes, never call MCP directly in code
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

export async function verifyToken(token: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        return null
      }
      throw new Error(`Token verification failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.member || data
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

