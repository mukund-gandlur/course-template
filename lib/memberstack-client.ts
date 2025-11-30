"use client"

let memberstackInstance: any = null

export async function getMemberstack() {
  if (typeof window === "undefined") {
    return null
  }

  if (memberstackInstance) {
    return memberstackInstance
  }

  try {
    const memberstack = (await import("@memberstack/dom")).default
    const publicKey = process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY

    if (!publicKey) {
      console.warn("NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY is not set")
      return null
    }

    memberstackInstance = await memberstack.init({
      publicKey,
      domain: "https://client.memberstack.com",
    })

    return memberstackInstance
  } catch (error) {
    console.error("Failed to initialize Memberstack:", error)
    return null
  }
}

export async function loginMember(email: string, password: string) {
  const ms = await getMemberstack()
  if (!ms) {
    throw new Error("Memberstack not initialized")
  }

  if (!ms.loginMemberEmailPassword) {
    throw new Error("loginMemberEmailPassword method not available")
  }

  const result = await ms.loginMemberEmailPassword({ email, password })
  
  // Try multiple ways to get the token
  let token = null
  
  // 1. Check the response first - Memberstack returns token in data.tokens.accessToken
  token = result?.data?.tokens?.accessToken || result?.data?.token || result?.token || result?.data?.accessToken || result?.accessToken
  
  // 2. Try to get token from SDK instance after login
  if (!token && ms) {
    try {
      // Try all possible methods
      if (typeof ms.getToken === 'function') {
        token = await ms.getToken()
      } else if (typeof ms.getAccessToken === 'function') {
        token = await ms.getAccessToken()
      } else if (typeof ms.getSessionToken === 'function') {
        token = await ms.getSessionToken()
      } else if (ms.token) {
        token = ms.token
      } else if (ms.accessToken) {
        token = ms.accessToken
      } else if (ms.sessionToken) {
        token = ms.sessionToken
      }
      
      // Also check if there's a member object with token
      if (!token && result?.data?.member) {
        token = result.data.member.token || result.data.member.accessToken
      }
      if (!token && result?.member) {
        token = result.member.token || result.member.accessToken
      }
    } catch (error) {
      // Token not available from SDK
    }
  }
  
  // Store token if we found it
  if (token && typeof window !== "undefined") {
    localStorage.setItem("memberstack_token", token)
  }
  
  return result
}

export async function signupMember(email: string, password: string) {
  const ms = await getMemberstack()
  if (!ms) {
    throw new Error("Memberstack not initialized")
  }

  if (!ms.signupMemberEmailPassword) {
    throw new Error("signupMemberEmailPassword method not available")
  }

  const result = await ms.signupMemberEmailPassword({ email, password })
  
  // Try multiple ways to get the token
  let token = null
  
  // 1. Check the response first - Memberstack returns token in data.tokens.accessToken
  token = result?.data?.tokens?.accessToken || result?.data?.token || result?.token || result?.data?.accessToken || result?.accessToken
  
  // 2. Try to get token from SDK instance after signup
  if (!token && ms) {
    try {
      // Try all possible methods
      if (typeof ms.getToken === 'function') {
        token = await ms.getToken()
      } else if (typeof ms.getAccessToken === 'function') {
        token = await ms.getAccessToken()
      } else if (typeof ms.getSessionToken === 'function') {
        token = await ms.getSessionToken()
      } else if (ms.token) {
        token = ms.token
      } else if (ms.accessToken) {
        token = ms.accessToken
      } else if (ms.sessionToken) {
        token = ms.sessionToken
      }
      
      // Also check if there's a member object with token
      if (!token && result?.data?.member) {
        token = result.data.member.token || result.data.member.accessToken
      }
      if (!token && result?.member) {
        token = result.member.token || result.member.accessToken
      }
    } catch (error) {
      // Token not available from SDK
    }
  }
  
  // Store token if we found it
  if (token && typeof window !== "undefined") {
    localStorage.setItem("memberstack_token", token)
  }
  
  return result
}

export async function getCurrentMember() {
  const ms = await getMemberstack()
  if (!ms) {
    return null
  }

  try {
    if (typeof window !== "undefined") {
      const cachedUser = localStorage.getItem("memberstack_user")
      if (cachedUser) {
        return JSON.parse(cachedUser)
      }
    }
  } catch (error) {
    console.error("Error getting cached member:", error)
  }

  return null
}

export async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    // First try localStorage
    let token = localStorage.getItem("memberstack_token")
    
    // If not in localStorage, try to get it from Memberstack instance
    if (!token) {
      const ms = await getMemberstack()
      if (ms) {
        // Try different possible methods to get token
        if (typeof ms.getToken === 'function') {
          token = await ms.getToken()
        } else if (typeof ms.getAccessToken === 'function') {
          token = await ms.getAccessToken()
        } else if (typeof ms.getSessionToken === 'function') {
          token = await ms.getSessionToken()
        } else if (ms.token) {
          token = ms.token
        } else if (ms.accessToken) {
          token = ms.accessToken
        } else if (ms.sessionToken) {
          token = ms.sessionToken
        }
        
        // Also try to get current member and check for token
        if (!token) {
          try {
            const member = await ms.getCurrentMember?.()
            if (member) {
              token = member.token || member.accessToken || member.sessionToken
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        // If we got a token, store it
        if (token) {
          localStorage.setItem("memberstack_token", token)
        }
      }
    }
    
    return token
  } catch (error) {
    console.error("Error getting token:", error)
    return null
  }
}

export async function logoutMember() {
  const ms = await getMemberstack()
  if (!ms) {
    // If memberstack isn't initialized, just clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("memberstack_user")
      localStorage.removeItem("memberstack_token")
    }
    return
  }

  try {
    // Try to use the logout method if available
    if (ms.logoutMember) {
      await ms.logoutMember()
    } else if (ms.logout) {
      await ms.logout()
    }
  } catch (error) {
    console.error("Error during logout:", error)
  } finally {
    // Always clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("memberstack_user")
      localStorage.removeItem("memberstack_token")
    }
  }
}

