'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { settings } from "@/services/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserSettings {
  theme: string;
  notifications: boolean;
  compressFiles: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'system',
    notifications: true,
    compressFiles: false,
  })

  useEffect(() => {
    if (!user) {
      return
    }
    loadSettings()
  }, [user])

  useEffect(() => {
    setTheme(userSettings.theme as 'light' | 'dark' | 'system')
  }, [userSettings.theme, setTheme])

  const handleSaveSettings = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await settings.updateUserSettings(user.id, {
        theme: userSettings.theme,
        notifications: userSettings.notifications,
        compressFiles: userSettings.compressFiles,
      })

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const loadSettings = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const loadedSettings = await settings.getUserSettings(user.id)
      
      if (loadedSettings) {
        setUserSettings({
          theme: loadedSettings.theme || 'system',
          notifications: loadedSettings.notifications !== undefined ? loadedSettings.notifications : true,
          compressFiles: loadedSettings.compressFiles || false,
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof UserSettings, value: string | boolean) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Appearance */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={userSettings.theme}
                      onValueChange={(value) => handleChange('theme', value)}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme for the application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - File Management */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">File Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about file operations.
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={userSettings.notifications}
                      onCheckedChange={(checked) => handleChange('notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compressFiles">Compress Files</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically compress files during upload to save space.
                      </p>
                    </div>
                    <Switch
                      id="compressFiles"
                      checked={userSettings.compressFiles}
                      onCheckedChange={(checked) => handleChange('compressFiles', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}