'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { settings } from "@/services/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserSettings {
  theme: string;
  autoBackup: boolean;
  backupFrequency: number;
  backupLocation: string;
  notifications: boolean;
  compressFiles: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'system',
    autoBackup: false,
    backupFrequency: 7,
    backupLocation: '',
    notifications: true,
    compressFiles: false,
  })

  useEffect(() => {
    async function loadSettings() {
      if (user) {
        setIsLoading(true)
        try {
          const loadedSettings = await settings.getUserSettings(user.id)
          if (loadedSettings) {
            setUserSettings(loadedSettings)
          } else {
            // If no settings found, try to load from localStorage as fallback
            const localSettings = localStorage.getItem('userSettings')
            if (localSettings) {
              setUserSettings(JSON.parse(localSettings))
            }
          }
        } catch (error) {
          console.error('Error loading settings:', error)
          // Try to load from localStorage as fallback
          const localSettings = localStorage.getItem('userSettings')
          if (localSettings) {
            setUserSettings(JSON.parse(localSettings))
          }
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadSettings()
  }, [user])

  const handleSaveSettings = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Save to Supabase
      await settings.updateUserSettings(user.id, userSettings)
      
      // Also save to localStorage as backup
      localStorage.setItem('userSettings', JSON.stringify(userSettings))
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      
      // Save to localStorage as fallback
      localStorage.setItem('userSettings', JSON.stringify(userSettings))
      
      toast({
        title: "Settings saved locally",
        description: "Your preferences could not be saved to the cloud but were saved locally.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof UserSettings, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Apply theme change immediately
    if (field === 'theme') {
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', value);
      
      // If using system theme, check user preference
      if (value === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Configure your application preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <div className="border-b mb-4">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger 
                  value="general" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="backup"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Backup
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    className="w-full p-2 border rounded-md"
                    value={userSettings.theme}
                    onChange={(e) => handleChange('theme', e.target.value)}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications about your files.
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
                    <p className="text-sm text-gray-500">
                      Automatically compress files when uploading.
                    </p>
                  </div>
                  <Switch
                    id="compressFiles"
                    checked={userSettings.compressFiles}
                    onCheckedChange={(checked) => handleChange('compressFiles', checked)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="backup" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoBackup">Automatic Backup</Label>
                    <p className="text-sm text-gray-500">
                      Automatically backup your files.
                    </p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={userSettings.autoBackup}
                    onCheckedChange={(checked) => handleChange('autoBackup', checked)}
                  />
                </div>
                {userSettings.autoBackup && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Backup Frequency (days)</Label>
                      <Input
                        id="backupFrequency"
                        type="number"
                        min="1"
                        value={userSettings.backupFrequency}
                        onChange={(e) => handleChange('backupFrequency', parseInt(e.target.value) || 7)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backupLocation">Backup Location</Label>
                      <Input
                        id="backupLocation"
                        placeholder="Enter backup location or path"
                        value={userSettings.backupLocation}
                        onChange={(e) => handleChange('backupLocation', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="flex justify-end w-full">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
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
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
