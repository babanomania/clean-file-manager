'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { settings } from '@/services/supabase'
import { useAuth } from './auth-context'

interface NotificationContextType {
  showNotification: (title: string, message: string, type?: 'default' | 'success' | 'error') => void
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Load notification settings when user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        try {
          const userSettings = await settings.getUserSettings(user.id)
          if (userSettings && userSettings.notifications !== undefined) {
            setNotificationsEnabled(userSettings.notifications)
          }
        } catch (error) {
          console.error('Error loading notification settings:', error)
        }
      }
    }

    loadSettings()
  }, [user])

  const showNotification = (title: string, message: string, type: 'default' | 'success' | 'error' = 'default') => {
    if (!notificationsEnabled) return

    // Map type to variant
    const variant = type === 'success' ? 'default' : 
                   type === 'error' ? 'destructive' : 'default'

    toast({
      title,
      description: message,
      variant
    })
  }

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      notificationsEnabled, 
      setNotificationsEnabled 
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
