'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { settings } from '@/services/supabase'
import { useAuth } from './auth-context'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage if available, otherwise default to system
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      return savedTheme || 'system'
    }
    return 'system'
  })
  const { user } = useAuth()

  // Load theme from user settings when user changes
  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        try {
          const userSettings = await settings.getUserSettings(user.id)
          if (userSettings && userSettings.theme) {
            const newTheme = userSettings.theme as Theme
            setTheme(newTheme)
            // Save to localStorage for persistence across public/private routes
            localStorage.setItem('theme', newTheme)
          }
        } catch (error) {
          console.error('Error loading theme settings:', error)
        }
      }
    }

    loadTheme()
  }, [user])

  // Save theme changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  // Apply theme changes to document
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // Listen for system theme changes if using system theme
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(mediaQuery.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
