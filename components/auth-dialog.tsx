"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loginMember, signupMember } from "@/lib/memberstack-client"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (member: any) => void
}

export function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await loginMember(email, password)
      
      const member = result?.data?.member || result?.member
      // Memberstack returns token in data.tokens.accessToken
      const token = result?.data?.tokens?.accessToken || result?.data?.token || result?.token || result?.data?.accessToken || result?.accessToken

      if (member) {
        // Try to get token from various places
        let finalToken = token
        
        // If no token in response, try to get it from SDK
        if (!finalToken) {
          try {
            const { getToken } = await import("@/lib/memberstack-client")
            finalToken = await getToken()
          } catch (e) {
            // Token not available from SDK
          }
        }
        
        if (finalToken) {
          localStorage.setItem("memberstack_token", finalToken)
        }
        localStorage.setItem("memberstack_user", JSON.stringify(member))
        onSuccess(member)
        setEmail("")
        setPassword("")
      } else {
        setError("Login failed. Please check your credentials.")
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signupMember(email, password)
      
      const member = result?.data?.member || result?.member
      // Memberstack returns token in data.tokens.accessToken
      const token = result?.data?.tokens?.accessToken || result?.data?.token || result?.token || result?.data?.accessToken || result?.accessToken

      if (member) {
        // Try to get token from various places
        let finalToken = token
        
        // If no token in response, try to get it from SDK
        if (!finalToken) {
          try {
            const { getToken } = await import("@/lib/memberstack-client")
            finalToken = await getToken()
          } catch (e) {
            // Token not available from SDK
          }
        }
        
        if (finalToken) {
          localStorage.setItem("memberstack_token", finalToken)
        }
        localStorage.setItem("memberstack_user", JSON.stringify(member))
        onSuccess(member)
        setEmail("")
        setPassword("")
      } else {
        setError("Signup failed. Please try again.")
      }
    } catch (err: any) {
      setError(err?.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

