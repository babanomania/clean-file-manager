'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Debug function to log authentication state
  const logAuthState = (message: string, data?: any) => {
    console.log(`[Auth] ${message}`, data || '')
  }

  useEffect(() => {
    // Check user on initial load
    checkUser()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        logAuthState(`Auth state changed: ${event}`, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          
          // Only redirect if we're on the login page
          if (window.location.pathname === '/login') {
            logAuthState('Redirecting to file manager from auth change')
            router.push('/file-manager')
          }
        } else {
          setUser(null)
          
          // Only redirect to login if we're on a protected page
          const publicPaths = ['/login', '/', '/signup']
          if (!publicPaths.includes(window.location.pathname)) {
            logAuthState('Redirecting to login from auth change')
            router.push('/login')
          }
        }
      }
    )

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  async function checkUser() {
    try {
      logAuthState('Checking current user session - START')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      logAuthState('Checking current user session - getSession FINISHED')

      // Handle potential error from getSession
      if (sessionError) {
        logAuthState('Error fetching session', sessionError)
        throw sessionError // Throw to be caught by outer catch
      }

      if (session?.user) {
        logAuthState('User found in session', session.user.email)
        setUser(session.user)

        // Only redirect if we're on the login page
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          logAuthState('Redirecting to file manager from session check')
          router.push('/file-manager')
        }
      } else {
        logAuthState('No user found in session')
        setUser(null)

        // Only redirect to login if we're on a protected page
        const publicPaths = ['/login', '/', '/signup']
        if (typeof window !== 'undefined' && !publicPaths.includes(window.location.pathname)) {
          logAuthState('Redirecting to login from session check')
          router.push('/login')
        }
      }
    } catch (error) {
      logAuthState('Error during checkUser', error)
      console.error('Error checking user:', error)
      setUser(null) // Ensure user is null on error
    } finally {
      logAuthState('Setting loading to false')
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    try {
      logAuthState('Signing in with email', email)
      
      // Clear any previous session first to avoid conflicts
      await supabase.auth.signOut()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        logAuthState('Sign in error', error.message)
        throw error
      }
      
      // Check if user is approved
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', data.user.id)
        .single()
        
      if (profileError) {
        logAuthState('Profile fetch error', profileError.message)
        throw new Error('Unable to verify account status. Please try again.')
      }
      
      if (!profileData.is_approved) {
        logAuthState('User not approved', data.user.email)
        // Sign out the user since they're not approved
        await supabase.auth.signOut()
        throw new Error('Your account is pending approval by an administrator. Please try again later.')
      }
      
      logAuthState('Sign in successful', data.user?.email)
      setUser(data.user)
      
      // Force a delay before redirect to ensure state is updated
      setTimeout(() => {
        logAuthState('Redirecting to file manager after login')
        router.push('/file-manager')
      }, 500)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async function signOut(): Promise<void> {
    try {
      logAuthState('Signing out')
      await supabase.auth.signOut()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
