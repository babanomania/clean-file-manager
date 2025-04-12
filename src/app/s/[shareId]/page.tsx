'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader, Download, Lock, FileText, Image, File } from 'react-feather'
import { supabase } from '@/services/supabase'
import { formatFileSize, formatRelativeTime } from '@/lib/utils'

interface ShareDetails {
  id: string
  file_id: string
  file_name: string
  file_type: string
  created_at: string
  expires_at: string | null
  is_password_protected: boolean
  access_count: number
}

export default function SharePage() {
  const params = useParams()
  const shareId = params.shareId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareDetails, setShareDetails] = useState<ShareDetails | null>(null)
  const [password, setPassword] = useState('')
  const [isPasswordRequired, setIsPasswordRequired] = useState(false)
  const [isPasswordVerifying, setIsPasswordVerifying] = useState(false)
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  useEffect(() => {
    async function fetchShareDetails() {
      if (!shareId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch share details
        const { data, error } = await supabase
          .from('shares')
          .select('*')
          .eq('id', shareId)
          .single()
        
        if (error) throw error
        
        if (!data) {
          setError('Share link not found or has expired')
          return
        }
        
        // Check if share has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError('This share link has expired')
          return
        }
        
        setShareDetails(data)
        
        // Check if password is required
        if (data.is_password_protected) {
          setIsPasswordRequired(true)
        } else {
          // If no password required, increment access count
          await incrementAccessCount()
        }
      } catch (err: any) {
        console.error('Error fetching share details:', err)
        setError('Failed to load share details. The link may be invalid or expired.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchShareDetails()
  }, [shareId])
  
  const incrementAccessCount = async () => {
    if (!shareId) return
    
    try {
      await supabase
        .from('shares')
        .update({ access_count: (shareDetails?.access_count || 0) + 1 })
        .eq('id', shareId)
    } catch (err) {
      console.error('Error incrementing access count:', err)
    }
  }
  
  const verifyPassword = async () => {
    if (!shareId || !password) return
    
    setIsPasswordVerifying(true)
    setIsPasswordIncorrect(false)
    
    try {
      // In a real app, this would make a secure API call to verify the password
      // For now, we'll do a simple check against the stored hash
      // Note: This is not secure and is just for demonstration
      const { data, error } = await supabase.rpc('verify_share_password', {
        share_id: shareId,
        password_attempt: password
      })
      
      if (error) throw error
      
      if (data === true) {
        setIsPasswordRequired(false)
        await incrementAccessCount()
      } else {
        setIsPasswordIncorrect(true)
      }
    } catch (err) {
      console.error('Error verifying password:', err)
      setIsPasswordIncorrect(true)
    } finally {
      setIsPasswordVerifying(false)
    }
  }
  
  const handleDownload = async () => {
    if (!shareDetails) return
    
    setIsDownloading(true)
    
    try {
      // First, get the file's storage_path
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', shareDetails.file_id)
        .single()
      
      if (fileError) throw fileError
      if (!fileData?.storage_path) throw new Error('File storage path not found')
      
      // Get file from storage
      const { data, error } = await supabase.storage
        .from('files')
        .download(fileData.storage_path)
      
      if (error) throw error
      
      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = shareDetails.file_name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading file:', err)
      setError('Failed to download file. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }
  
  // Function to get appropriate icon based on file type
  const getFileIcon = () => {
    if (!shareDetails) return <File className="h-12 w-12 text-gray-400" />
    
    const type = shareDetails.file_type.toLowerCase()
    
    if (type.includes('image')) {
      return <Image className="h-12 w-12 text-blue-500" />
    } else if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <FileText className="h-12 w-12 text-red-500" />
    } else {
      return <File className="h-12 w-12 text-gray-500" />
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Share Link Error</CardTitle>
            <CardDescription>There was a problem with this share link</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (isPasswordRequired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>This file requires a password to access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Lock className="h-12 w-12 text-amber-500" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Enter Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                />
                
                {isPasswordIncorrect && (
                  <p className="text-sm text-red-500">
                    Incorrect password. Please try again.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={verifyPassword}
              disabled={!password || isPasswordVerifying}
            >
              {isPasswordVerifying ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access File'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {shareDetails && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Shared File</CardTitle>
            <CardDescription>
              This file has been shared with you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {getFileIcon()}
                <div>
                  <h3 className="font-medium">{shareDetails.file_name}</h3>
                  <p className="text-sm text-gray-500">
                    {shareDetails.file_type}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <p className="text-gray-500">
                  Shared: {formatRelativeTime(new Date(shareDetails.created_at))}
                </p>
                {shareDetails.expires_at && (
                  <p className="text-gray-500">
                    Expires: {formatRelativeTime(new Date(shareDetails.expires_at))}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full"
            >
              {isDownloading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
