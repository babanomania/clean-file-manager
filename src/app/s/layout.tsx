'use client'

import { Inter } from "next/font/google"
import { Toaster } from '@/components/ui/toaster'
import { useTheme } from "@/contexts/theme-context"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme } = useTheme()
  
  // Apply theme class to html element
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <div className={inter.className}>
      {children}
      <Toaster />
    </div>
  )
}
