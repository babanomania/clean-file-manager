'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { 
  Archive, 
  Download, 
  File as FileIcon, 
  Folder, 
  FolderPlus, 
  Grid, 
  List, 
  MoreVertical, 
  Share2, 
  Trash2, 
  Upload, 
  Edit,
  Image,
  FileText,
  Film,
  Music,
  Package,
  File,
  ChevronUp,
  ArrowUp
} from "react-feather"
import { files } from "@/services/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Update the type definitions to match the actual data structure
type FileRecord = {
  id: string
  name: string
  type: string
  size: number
  storage_path: string
  user_id: string
  directory_path?: string
  created_at: string
  updated_at: string
  localUrl?: string
}

type DirectoryRecord = {
  id: string
  name: string
  type: string
  storage_path: string
  user_id: string
  path?: string
  parent_path?: string
  directory_path?: string
  created_at: string
  updated_at: string
}

export default function FileManagerPage() {
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [fileList, setFileList] = useState<FileRecord[]>([])
  const [directories, setDirectories] = useState<DirectoryRecord[]>([])
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null)
  const [selectedDirectory, setSelectedDirectory] = useState<DirectoryRecord | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteDirDialogOpen, setIsDeleteDirDialogOpen] = useState(false)
  const [isCreateDirDialogOpen, setIsCreateDirDialogOpen] = useState(false)
  const [isRenameDirDialogOpen, setIsRenameDirDialogOpen] = useState(false)
  const [newDirName, setNewDirName] = useState("")
  const [renameDirName, setRenameDirName] = useState("")
  const [currentPath, setCurrentPath] = useState("/")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<(FileRecord | DirectoryRecord)[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Only load files when user is authenticated and not in loading state
    if (user && !loading) {
      fetchFilesAndDirectories()
    }
  }, [user, loading, currentPath, router])

  const fetchFilesAndDirectories = async () => {
    if (!user) return // Safety check
    
    setIsLoading(true)
    try {
      // Get files
      const fileList = await files.getFiles(user.id, currentPath)
      
      // Get directories
      const directories = await files.getDirectories(user.id, currentPath)
      
      setFileList(fileList)
      setDirectories(directories)
    } catch (error) {
      console.error('Error fetching files and directories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load files and directories',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If still in authentication loading state, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-blue-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (will be redirected in useEffect)
  if (!user) {
    return null
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0] || !user) return
    
    const file = e.target.files[0]
    
    try {
      setIsLoading(true)
      console.log('Uploading file to path:', currentPath)
      await files.upload(file, user.id, currentPath)
      
      // Clear the input value to allow uploading the same file again
      e.target.value = ''
      
      // Fetch files again to update the UI
      await fetchFilesAndDirectories()
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFileDelete() {
    if (!selectedFile || !user) return

    try {
      setIsLoading(true)
      await files.delete(selectedFile.id, user.id)
      await fetchFilesAndDirectories()
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
      setSelectedFile(null)
    }
  }

  async function handleDirectoryDelete() {
    if (!selectedDirectory || !user) return

    try {
      setIsLoading(true)
      await files.deleteDirectory(selectedDirectory.id, user.id)
      await fetchFilesAndDirectories()
      toast({
        title: "Success",
        description: "Directory deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting directory:', error)
      toast({
        title: "Error",
        description: "Failed to delete directory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDirDialogOpen(false)
      setSelectedDirectory(null)
    }
  }

  async function handleDirectoryRename() {
    if (!selectedDirectory || !user || !renameDirName.trim()) {
      toast({
        title: "Error",
        description: "Directory name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await files.renameDirectory(selectedDirectory.id, renameDirName, user.id)
      await fetchFilesAndDirectories()
      toast({
        title: "Success",
        description: "Directory renamed successfully",
      })
    } catch (error) {
      console.error('Error renaming directory:', error)
      toast({
        title: "Error",
        description: "Failed to rename directory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRenameDirDialogOpen(false)
      setSelectedDirectory(null)
      setRenameDirName("")
    }
  }

  async function handleCreateDirectory() {
    if (!newDirName.trim() || !user) {
      toast({
        title: "Error",
        description: "Directory name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await files.createDirectory(newDirName, user.id, currentPath)
      await fetchFilesAndDirectories()
      toast({
        title: "Success",
        description: "Directory created successfully",
      })
      setNewDirName("")
    } catch (error) {
      console.error('Error creating directory:', error)
      toast({
        title: "Error",
        description: "Failed to create directory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsCreateDirDialogOpen(false)
    }
  }

  async function handleFileDownload(file: FileRecord) {
    if (!user) return

    try {
      setIsLoading(true)
      
      // If we have a localUrl, use it directly
      if (file.localUrl) {
        console.log('Using local URL for download:', file.localUrl);
        
        // Create download link from local URL
        const a = document.createElement('a');
        a.href = file.localUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "File download started",
        });
        return;
      }
      
      // Otherwise try the regular download method
      const { blob, fileName } = await files.download(file.id, user.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "File download started",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadAsZip() {
    if (!user) return

    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to download",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const fileIds = selectedItems
        .filter(item => 'storage_path' in item)
        .map(item => (item as FileRecord).id)
      
      const directoryIds = selectedItems
        .filter(item => !('storage_path' in item))
        .map(item => (item as DirectoryRecord).id)
      
      const { blob, zipName } = await files.downloadAsZip(fileIds, directoryIds, user.id, currentPath)
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Zip download started",
      });
      setSelectedItems([]);
    } catch (error) {
      console.error('Error downloading as zip:', error);
      toast({
        title: "Error",
        description: "Failed to download as zip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleNavigateToDirectory(directory: DirectoryRecord) {
    // Use storage_path and extract the path after the userId
    const userId = user?.id || '';
    // Extract the path from storage_path (remove userId prefix)
    const pathWithoutUserId = directory.storage_path.replace(`${userId}/`, '');
    // Ensure it starts with a slash
    const path = pathWithoutUserId.startsWith('/') ? pathWithoutUserId : `/${pathWithoutUserId}`;
    console.log('Navigating to directory:', path);
    setCurrentPath(path);
  }

  function handleNavigateUp() {
    if (currentPath === "/") return
    
    const pathParts = currentPath.split("/").filter(Boolean)
    pathParts.pop()
    const newPath = pathParts.length === 0 ? "/" : `/${pathParts.join("/")}/`
    setCurrentPath(newPath)
  }

  function handleItemSelect(item: FileRecord | DirectoryRecord, isSelected: boolean) {
    if (isSelected) {
      setSelectedItems([...selectedItems, item])
    } else {
      setSelectedItems(selectedItems.filter(i => {
        // Check if both items are files (have storage_path) or both are directories
        const isSameType = ('storage_path' in i && 'storage_path' in item) || 
                          (!('storage_path' in i) && !('storage_path' in item));
        
        // Only compare IDs if they're the same type
        return !isSameType || i.id !== item.id;
      }))
    }
  }

  function isItemSelected(item: FileRecord | DirectoryRecord) {
    return selectedItems.some(i => {
      // Check if both items are files (have storage_path) or both are directories
      const isSameType = ('storage_path' in i && 'storage_path' in item) || 
                        (!('storage_path' in i) && !('storage_path' in item));
      
      // Only compare IDs if they're the same type
      return isSameType && i.id === item.id;
    })
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function getFileIcon(fileType: string) {
    if (fileType.includes('image')) return <Image className="h-6 w-6 text-blue-500" />
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
    if (fileType.includes('text')) return <FileText className="h-6 w-6 text-gray-500" />
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-6 w-6 text-green-500" />
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <FileText className="h-6 w-6 text-orange-500" />
    if (fileType.includes('zip') || fileType.includes('archive')) return <Package className="h-6 w-6 text-purple-500" />
    if (fileType.includes('audio')) return <Music className="h-6 w-6 text-pink-500" />
    if (fileType.includes('video')) return <Film className="h-6 w-6 text-indigo-500" />
    return <FileIcon className="h-6 w-6 text-gray-500" />
  }

  const hasDirectoriesSelected = selectedItems.some(item => !('storage_path' in item))

  function openRenameDirectoryDialog(directory: DirectoryRecord) {
    setSelectedDirectory(directory)
    setRenameDirName(directory.name)
    setIsRenameDirDialogOpen(true)
  }

  function renderDirectoryActions(directory: DirectoryRecord) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => handleNavigateToDirectory(directory)}
          >
            Open
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => openRenameDirectoryDialog(directory)}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              setSelectedDirectory(directory)
              setIsDeleteDirDialogOpen(true)
            }}
            className="text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  useEffect(() => {
    const handleFileUploaded = (event: any) => {
      console.log('File uploaded event received:', event.detail);
      fetchFilesAndDirectories();
    };
    
    const handleDirectoryCreated = (event: any) => {
      console.log('Directory created event received:', event.detail);
      fetchFilesAndDirectories();
    };
    
    window.addEventListener('file-uploaded', handleFileUploaded);
    window.addEventListener('directory-created', handleDirectoryCreated);
    
    return () => {
      window.removeEventListener('file-uploaded', handleFileUploaded);
      window.removeEventListener('directory-created', handleDirectoryCreated);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Hero Section */}
      <div>
        <h3 className="text-lg font-medium">File Manager</h3>
        <p className="text-sm text-gray-500">
          Manage and organize your files and folders.
        </p>
      </div>

      {/* File Manager Card with Integrated Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center text-sm text-gray-500">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto font-normal hover:bg-transparent hover:text-blue-600"
                onClick={handleNavigateUp}
                disabled={currentPath === "/"}
              >
                Root
              </Button>
              {currentPath && currentPath !== "/" && (
                <>
                  <span className="mx-1">/</span>
                  {currentPath.split("/").filter(Boolean).map((part, index, array) => (
                    <div key={index} className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto font-normal hover:bg-transparent hover:text-blue-600"
                        onClick={() => {
                          const newPath = `/${array.slice(0, index + 1).join("/")}/`
                          setCurrentPath(newPath)
                        }}
                      >
                        {part}
                      </Button>
                      {index < array.length - 1 && <span className="mx-1">/</span>}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-blue-100' : ''}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-blue-100' : ''}
              >
                <Grid className="h-4 w-4 mr-1" />
                Grid
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Action Toolbar */}
          <div className="flex flex-wrap gap-2 px-4 py-2 border-y">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateUp}
              disabled={currentPath === "/"}
            >
              <ChevronUp className="h-4 w-4 mr-1" />
              Up
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateDirDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              New Folder
            </Button>
            
            <label>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAsZip}
              disabled={selectedItems.length === 0}
            >
              <Archive className="h-4 w-4 mr-1" />
              Download Selected
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={selectedItems.length === 0 || isLoading}
              onClick={() => {
                if (selectedItems.length === 0) return
                
                // If only one file is selected and it's a file (not a directory)
                if (selectedItems.length === 1 && 'storage_path' in selectedItems[0]) {
                  handleFileDownload(selectedItems[0] as FileRecord)
                } else {
                  handleDownloadAsZip()
                }
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              {selectedItems.length === 1 && 'storage_path' in selectedItems[0] 
                ? 'Download' 
                : 'Download as ZIP'}
            </Button>
          </div>

          {/* File/Directory List or Grid */}
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <Table className="mb-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directories.map((directory) => (
                    <TableRow key={`dir-${directory.id}`} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                      <TableCell>
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isItemSelected(directory)}
                          onChange={(e) => handleItemSelect(directory, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Folder className="h-5 w-5 text-blue-600" />
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleNavigateToDirectory(directory)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {directory.name}
                        </button>
                      </TableCell>
                      <TableCell>Folder</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {new Date(directory.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {renderDirectoryActions(directory)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {fileList.map((file) => (
                    <TableRow key={file.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                      <TableCell>
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isItemSelected(file)}
                          onChange={(e) => handleItemSelect(file, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <span className="text-lg text-blue-600">{getFileIcon(file.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{file.name}</TableCell>
                      <TableCell>{file.type.split('/')[1]?.toUpperCase() || file.type}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        {new Date(file.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleFileDownload(file)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedFile(file)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {directories.length === 0 && fileList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Folder className="h-8 w-8 mb-2 text-gray-400" />
                          <p>No files or folders found</p>
                          <p className="text-sm">Upload files or create a new folder to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="h-4"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
              {directories.map((directory) => (
                <div 
                  key={directory.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow p-4 border rounded-md ${
                    isItemSelected(directory) ? 'border-2 border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isItemSelected(directory)}
                          onChange={(e) => handleItemSelect(directory, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-2"
                        />
                      </div>
                      {renderDirectoryActions(directory)}
                    </div>
                    <div 
                      className="flex flex-col items-center w-full"
                      onClick={() => handleNavigateToDirectory(directory)}
                    >
                      <Folder className="h-16 w-16 text-blue-600 mb-2" />
                      <div className="font-medium text-center truncate w-full">
                        {directory.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(directory.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {fileList.map((file) => (
                <div 
                  key={file.id} 
                  className={`hover:shadow-md transition-shadow p-4 border rounded-md ${
                    isItemSelected(file) ? 'border-2 border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isItemSelected(file)}
                          onChange={(e) => handleItemSelect(file, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-2"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleFileDownload(file)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedFile(file)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div 
                      className="flex flex-col items-center w-full"
                      onClick={() => handleFileDownload(file)}
                    >
                      <div className="mb-2 text-blue-600">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="font-medium text-center truncate w-full">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(file.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {directories.length === 0 && fileList.length === 0 && (
                <div className="col-span-full h-48 flex flex-col items-center justify-center text-gray-500">
                  <Folder className="h-12 w-12 mb-2 text-gray-400" />
                  <p>No files or folders found</p>
                  <p className="text-sm">Upload files or create a new folder to get started</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file "{selectedFile?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFileDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDirDialogOpen} onOpenChange={setIsDeleteDirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder "{selectedDirectory?.name}" and all its contents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDirectoryDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateDirDialogOpen} onOpenChange={setIsCreateDirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                placeholder="My Folder"
                value={newDirName}
                onChange={(e) => setNewDirName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDirDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDirectory} disabled={!newDirName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameDirDialogOpen} onOpenChange={setIsRenameDirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Directory</DialogTitle>
            <DialogDescription>
              Enter a new name for this directory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-dir-name" className="text-right">
                Name
              </Label>
              <Input
                id="rename-dir-name"
                value={renameDirName}
                onChange={(e) => setRenameDirName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRenameDirDialogOpen(false)
                setSelectedDirectory(null)
                setRenameDirName("")
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDirectoryRename}
              disabled={isLoading || !renameDirName.trim()}
            >
              {isLoading ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
