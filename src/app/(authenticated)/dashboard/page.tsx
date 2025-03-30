'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { FileText, Image, Music, Film, Archive, Loader } from "react-feather"
import { useEffect, useState } from "react"
import { files } from "@/services/supabase"
import { useAuth } from "@/contexts/auth-context"
import { formatFileSize, formatRelativeTime } from "@/lib/utils"
import { Icon } from "react-feather"

// Define types for storage usage and file data
interface StorageBreakdownItem {
  type: string;
  size: number;
}

interface StorageUsage {
  total: number;
  used: number;
  breakdown: StorageBreakdownItem[];
}

interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  updated_at: string;
  [key: string]: any; // For any additional properties
}

// Icon mapping for file types
const iconMap: Record<string, Icon> = {
  "Documents": FileText,
  "Images": Image,
  "Audio": Music,
  "Video": Film,
  "Archives": Archive
}

// Color mapping for file types
const colorMap: Record<string, string> = {
  "Documents": "text-blue-500",
  "Images": "text-green-500",
  "Audio": "text-yellow-500",
  "Video": "text-purple-500",
  "Archives": "text-gray-500"
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({
    total: 100, // GB
    used: 0,
    breakdown: []
  })
  const [recentFiles, setRecentFiles] = useState<FileData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (user) {
        setIsLoading(true)
        try {
          // Load storage usage
          const usageData = await files.getStorageUsage(user.id)
          setStorageUsage(usageData as StorageUsage)
          
          // Load recent files
          const recentFilesData = await files.getRecentFiles(user.id, 5)
          setRecentFiles(recentFilesData as FileData[])
        } catch (error) {
          console.error('Error loading dashboard data:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    loadData()
  }, [user])

  const usedPercentage = (storageUsage.used / storageUsage.total) * 100

  // Format the timestamp to a relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp: string): string => {
    if (!timestamp) return "Unknown"
    return formatRelativeTime(new Date(timestamp))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <CardDescription>
              {storageUsage.used.toFixed(1)} GB used of {storageUsage.total} GB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={usedPercentage} className="h-2" />
              <div className="grid gap-4">
                {storageUsage.breakdown.map((item) => {
                  const Icon = iconMap[item.type] || FileText
                  const colorClass = colorMap[item.type] || "text-gray-500"
                  return (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                        <span className="text-sm font-medium">{item.type}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {item.size.toFixed(1)} GB
                      </span>
                    </div>
                  )
                })}
                
                {storageUsage.breakdown.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No files uploaded yet
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>Your recently modified files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFiles.length > 0 ? (
                recentFiles.map((file, index) => (
                  <div key={file.id}>
                    {index > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.type} • {formatFileSize(file.size)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">{getRelativeTime(file.updated_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  No recent files
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
