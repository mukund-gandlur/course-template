"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth-dialog"
import { logoutMember } from "@/lib/memberstack-client"
import { clearAuthCache } from "@/lib/data-helpers"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Heart, ShoppingCart, BookOpen, Settings } from "lucide-react"

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window === "undefined") return

        const cachedUser = localStorage.getItem("memberstack_user")
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser)
            setUser(parsed)
          } catch (e) {
            // Invalid cache
          }
        }

        // Import memberstack dynamically
        const memberstack = (await import("@memberstack/dom")).default
        const publicKey = process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY

        if (publicKey) {
          const ms = await memberstack.init({
            publicKey,
            domain: "https://client.memberstack.com",
          })

          if (ms) {
            // Listen for auth state changes
            if (ms.onAuthChange) {
              ms.onAuthChange((member: any) => {
                if (member) {
                  setUser(member)
                  localStorage.setItem("memberstack_user", JSON.stringify(member))
                } else {
                  setUser(null)
                  localStorage.removeItem("memberstack_user")
                  localStorage.removeItem("memberstack_token")
                }
              })
            }
          }
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await logoutMember()
      setUser(null)
      clearAuthCache()
      // Refresh the page to update the UI
      router.refresh()
    } catch (error) {
      setUser(null)
      clearAuthCache()
      router.refresh()
    }
  }

  const getUserDisplayName = () => {
    if (!user) return ""
    const firstName = user["first-name"] || user.firstName || user.name?.first
    const lastName = user["last-name"] || user.lastName || user.name?.last
    if (firstName || lastName) {
      return `${firstName || ""} ${lastName || ""}`.trim()
    }
    return user.email || "User"
  }

  const userDisplayName = getUserDisplayName()
  const userEmail = user?.email || ""

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Memberstack</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/courses" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Courses
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-9 w-20 bg-gray-200 animate-pulse rounded" />
          ) : (
            <>
              {/* Wishlist Icon */}
              <button 
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
              
              {/* Cart Icon */}
              <button 
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  3
                </span>
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-9 px-3 hover:bg-gray-100"
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="hidden sm:flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900">{userDisplayName}</span>
                        {userEmail && userDisplayName !== userEmail && (
                          <span className="text-xs text-gray-500">{userEmail}</span>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                        {userEmail && (
                          <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/courses/new" className="flex items-center cursor-pointer">
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>My Courses</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <button className="flex items-center w-full cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setIsAuthDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Sign In
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <AuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onSuccess={(member) => {
          setUser(member)
          setIsAuthDialogOpen(false)
        }}
      />
    </header>
  )
}

