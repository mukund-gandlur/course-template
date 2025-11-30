/**
 * Data helper functions
 */

export function safeJsonParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

export function getCachedUser() {
  if (typeof window === "undefined") return null
  return safeJsonParse(localStorage.getItem("memberstack_user"), null)
}

export function getCachedToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("memberstack_token")
}

export function clearAuthCache() {
  if (typeof window === "undefined") return
  localStorage.removeItem("memberstack_user")
  localStorage.removeItem("memberstack_token")
}

