'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, Home, Settings, Share2, LogOut } from "react-feather"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import Logo from "@/components/Logo"
import { supabase } from "@/services/supabase"
import { ShieldCheck } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Files", href: "/file-manager", icon: FileText },
  { name: "Share", href: "/share", icon: Share2 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      // Check if user is admin
      checkAdminStatus()
    }
  }, [loading, user, router])

  const checkAdminStatus = async () => {
    if (!user) return
    
    try {
      console.log('Checking admin status for user:', user.id)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      }
      
      console.log('User profile data:', data)
      
      if (data.role === 'admin') {
        console.log('User is admin, setting isAdmin to true')
        setIsAdmin(true)
      } else {
        console.log('User is not admin, role:', data.role)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-blue-950/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-blue-950/50">
      <div className="flex h-16 items-center gap-6 bg-white dark:bg-gray-900 px-6 shadow-sm">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="sm" />
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <nav className="flex flex-1 items-center gap-6">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
          
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 text-sm font-medium ${
                pathname === "/admin"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user.email || 'User'} />
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <main className="container mx-auto py-6">{children}</main>
      <Toaster />
    </div>
  )
}
