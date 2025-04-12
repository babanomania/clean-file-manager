'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { sharing } from "@/services/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader, Link, Copy, Trash2, Calendar, Lock, Share2 } from "react-feather"
import { useToast } from "@/hooks/use-toast"
import { formatRelativeTime } from "@/lib/utils"

interface ShareLink {
  id: string;
  file_id: string;
  file_name: string;
  file_type: string;
  url: string;
  created_at: string;
  expires_at: string | null;
  is_password_protected: boolean;
  access_count: number;
}

export default function SharePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [files, setFiles] = useState<Array<{id: string, name: string, type: string}>>([])
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [newShareSettings, setNewShareSettings] = useState({
    expiryEnabled: false,
    expiryDays: 7,
    passwordEnabled: false,
    password: '',
  })
  
  useEffect(() => {
    async function loadData() {
      if (user) {
        setIsLoading(true)
        try {
          // Load share links
          const links = await sharing.listShares(user.id)
          setShareLinks(links)
          
          // Load files for sharing
          const filesData = await sharing.getShareableFiles(user.id)
          setFiles(filesData)
        } catch (error) {
          console.error('Error loading share data:', error)
          toast({
            title: "Error",
            description: "Failed to load share links. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    loadData()
  }, [user, toast])
  
  const handleCreateShareLink = async () => {
    if (!user || !selectedFile) return
    
    setIsCreatingLink(true)
    try {
      const shareData = {
        fileId: selectedFile,
        expiresAt: newShareSettings.expiryEnabled ? 
          new Date(Date.now() + newShareSettings.expiryDays * 24 * 60 * 60 * 1000).toISOString() : 
          null,
        password: newShareSettings.passwordEnabled ? newShareSettings.password : null
      }
      
      const newShare = await sharing.create(user.id, shareData)
      
      setShareLinks(prev => [newShare, ...prev])
      
      // Reset form
      setSelectedFile(null)
      setNewShareSettings({
        expiryEnabled: false,
        expiryDays: 7,
        passwordEnabled: false,
        password: '',
      })
      
      toast({
        title: "Share link created",
        description: "Your file is now shared and accessible via the link.",
      })
    } catch (error) {
      console.error('Error creating share link:', error)
      toast({
        title: "Error",
        description: "Failed to create share link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingLink(false)
    }
  }
  
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard.",
    })
  }
  
  const handleDeleteShare = async (shareId: string) => {
    if (!user) return
    
    try {
      await sharing.deleteShare(shareId, user.id)
      setShareLinks(prev => prev.filter(link => link.id !== shareId))
      toast({
        title: "Share deleted",
        description: "The share link has been deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting share:', error)
      toast({
        title: "Error",
        description: "Failed to delete share link. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Format the expiry date
  const formatExpiryDate = (expiryDate: string | null) => {
    if (!expiryDate) return "Never expires"
    return formatRelativeTime(new Date(expiryDate))
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
        <h3 className="text-lg font-medium">Share Files</h3>
        <p className="text-sm text-gray-500">
          Create and manage share links for your files.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Share Link</CardTitle>
            <CardDescription>
              Share your files with others by creating a link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Select value={selectedFile || ""} onValueChange={setSelectedFile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a file to share" />
                </SelectTrigger>
                <SelectContent>
                  {files.map(file => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="expiry">Set Expiry Date</Label>
                <p className="text-sm text-gray-500">
                  Link will expire after the specified time.
                </p>
              </div>
              <Switch
                id="expiry"
                checked={newShareSettings.expiryEnabled}
                onCheckedChange={(checked) => setNewShareSettings(prev => ({
                  ...prev,
                  expiryEnabled: checked
                }))}
              />
            </div>
            
            {newShareSettings.expiryEnabled && (
              <div className="space-y-2">
                <Label htmlFor="expiryDays">Expires After (days)</Label>
                <Input
                  id="expiryDays"
                  type="number"
                  min="1"
                  value={newShareSettings.expiryDays}
                  onChange={(e) => setNewShareSettings(prev => ({
                    ...prev,
                    expiryDays: parseInt(e.target.value) || 7
                  }))}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="password">Password Protection</Label>
                <p className="text-sm text-gray-500">
                  Require a password to access the shared file.
                </p>
              </div>
              <Switch
                id="password"
                checked={newShareSettings.passwordEnabled}
                onCheckedChange={(checked) => setNewShareSettings(prev => ({
                  ...prev,
                  passwordEnabled: checked
                }))}
              />
            </div>
            
            {newShareSettings.passwordEnabled && (
              <div className="space-y-2">
                <Label htmlFor="passwordValue">Password</Label>
                <Input
                  id="passwordValue"
                  type="password"
                  value={newShareSettings.password}
                  onChange={(e) => setNewShareSettings(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                  placeholder="Enter a secure password"
                />
              </div>
            )}
            
            <Button 
              onClick={handleCreateShareLink} 
              disabled={!selectedFile || isCreatingLink}
            >
              {isCreatingLink ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Create Share Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Share Links</CardTitle>
            <CardDescription>
              Manage your existing share links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shareLinks.length > 0 ? (
                shareLinks.map((share, index) => (
                  <div key={share.id} className="space-y-3">
                    {index > 0 && <Separator />}
                    <div className="pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{share.file_name}</p>
                          <p className="text-sm text-gray-500">
                            Created {formatRelativeTime(new Date(share.created_at))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCopyLink(share.url)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteShare(share.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatExpiryDate(share.expires_at)}
                        </div>
                        {share.is_password_protected && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Lock className="mr-1 h-3 w-3" />
                            Password protected
                          </div>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <Link className="mr-1 h-3 w-3" />
                          {share.access_count} {share.access_count === 1 ? 'access' : 'accesses'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Share2 className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-lg font-medium">No share links yet</h3>
                  <p className="text-sm text-gray-500">
                    Create your first share link to start sharing files.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
