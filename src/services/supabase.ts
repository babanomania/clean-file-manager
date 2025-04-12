import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase'
import JSZip from 'jszip'

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Check if client creation was successful
if (supabase) {
} else {
}

// Types
export interface FileRecord {
  id: string
  name: string
  type: string
  size: number
  storage_path: string
  user_id: string
  created_at: string
  updated_at: string
  directory_path?: string
  parent_directory_id?: string
  is_directory?: boolean
  publicUrl?: string
  localUrl?: string
}

export interface ShareRecord {
  id: string
  file_id: string
  share_type: 'temporary' | 'permanent'
  share_link: string
  expiry_date?: string
  password?: string
  downloads: number
  created_at: string
}

export interface BackupRecord {
  id: string
  user_id: string
  backup_date: string
  backup_path: string
  backup_type: 'one-click' | 'scheduled'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  size: number
}

// Authentication
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },
}

// File Management
const filesObj = {
  upload: async (file: File, userId: string, directoryPath: string = "/", compressFiles: boolean = false) => {
    // Ensure directoryPath ends with a slash if it's not the root
    const normalizedParentPath = directoryPath === '/' ? '/' : directoryPath.endsWith('/') ? directoryPath : `${directoryPath}/`;
    // Construct the full path including the user ID prefix
    let fullStoragePath = `${userId}${normalizedParentPath}${file.name}`;

    try {
      // Ensure we have an authenticated session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication required for file upload');
      }

      let uploadSuccessful = false;
      let fileToUpload = file;
      let fileName = file.name;
      let fileType = file.type || getMimeType(file.name);
      let fileSize = file.size;

      // Apply compression if enabled
      if (compressFiles) {
        try {
          // Import compression utility dynamically to avoid issues with SSR
          const { compressFile } = await import('@/lib/compression');
          fileToUpload = await compressFile(file);
          
          // Update file metadata for the compressed file
          fileName = fileToUpload.name;
          fileType = fileToUpload.type;
          fileSize = fileToUpload.size;
          
          // Update storage path for the compressed file
          fullStoragePath = `${userId}${normalizedParentPath}${fileName}`;
        } catch (compressionError) {
          // If compression fails, continue with the original file
          console.error('Compression failed, using original file:', compressionError);
        }
      }

      // Try direct upload first
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fullStoragePath, fileToUpload, {
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError; // Re-throw the error to be caught by the outer catch block
      } else {
        uploadSuccessful = true;
      }

      // If upload was successful, insert the file metadata into the database
      if (uploadSuccessful) {
        const fileRecord = {
          name: fileName,
          type: fileType,
          size: fileSize,
          storage_path: fullStoragePath,
          user_id: userId,
          directory_path: normalizedParentPath,
          is_directory: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: insertData, error: insertError } = await supabase
          .from('files')
          .insert(fileRecord)
          .select(); // Select to get the inserted record back

        if (insertError) {
          throw insertError;
        }

        return insertData ? insertData[0] : null;
      } else {
        throw new Error('File upload failed before database insert.');
      }

    } catch (error) {
      throw error;
    }
  },

  createDirectory: async (name: string, userId: string, parentPath: string = "/") => {
    // Normalize parent path: ensure it starts and ends with '/', except for root '/'
    let normalizedParentPath = '/';
    if (parentPath && parentPath !== '/') {
        normalizedParentPath = parentPath.startsWith('/') ? parentPath : `/${parentPath}`;
        normalizedParentPath = normalizedParentPath.endsWith('/') ? normalizedParentPath : `${normalizedParentPath}/`;
    }

    // Construct the full path for the new directory
    const newDirectoryPath = `${normalizedParentPath}${name}/`;

    try {
      // Check if a directory with the same name already exists at this path for this user
      const { data: existingDirs, error: checkError } = await supabase
        .from('files')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .eq('directory_path', normalizedParentPath)
        .eq('is_directory', true);

      if (checkError) {
        throw checkError;
      }

      if (existingDirs && existingDirs.length > 0) {
        throw new Error(`Directory '${name}' already exists here.`);
      }

      // Prepare the record for the 'files' table
      const directoryRecord = {
        name: name,
        user_id: userId,
        type: 'directory',
        size: 0, // Directories don't have a size
        storage_path: `${userId}${newDirectoryPath}`, // Full path including user ID
        directory_path: normalizedParentPath === '/' ? '/' : normalizedParentPath, // Explicitly set to '/' for root
        is_directory: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert the record into the 'files' table
      const { data: insertData, error: insertError } = await supabase
        .from('files')
        .insert([directoryRecord])
        .select(); // Select to get the inserted record back

      if (insertError) {
        throw insertError;
      }

      return insertData ? insertData[0] : null;
    } catch (error) {
      throw error;
    }
  },

  getFiles: async (userId: string, directoryPath: string = "/") => {
    try {
      // Try to get files from Supabase first
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .neq('type', 'directory');
        
      if (error) {
        throw error;
      }
      
      // Filter files based on the directory path
      const filteredFiles = data.filter(file => {
        const path = file.storage_path;
        
        // Remove userId from the beginning
        const pathWithoutUserId = path.replace(`${userId}/`, '');
        
        if (directoryPath === '/') {
          // For root files, there should be no slashes in the path
          return pathWithoutUserId.indexOf('/') === -1;
        } else {
          // For files in directories, the path should start with the directory path
          // and have exactly one more directory level
          const dirPathWithoutLeadingSlash = directoryPath.startsWith('/') 
            ? directoryPath.substring(1) 
            : directoryPath;
            
          return pathWithoutUserId.startsWith(dirPathWithoutLeadingSlash) && 
                 pathWithoutUserId.replace(dirPathWithoutLeadingSlash, '').indexOf('/') === -1;
        }
      });
      
      // Add directory_path for compatibility
      const mappedFiles = filteredFiles.map(file => ({
        ...file,
        directory_path: directoryPath
      }));
      
      return mappedFiles;
    } catch (error) {
      return [];
    }
  },

  getDirectories: async (userId: string, directoryPath: string = "/") => {
    // Normalize the directory path
    const normalizedPath = directoryPath === '/' ? '/' : directoryPath.endsWith('/') ? directoryPath : `${directoryPath}/`;

    try {
      // Try to get directories from Supabase
      const { data: directories, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .eq('is_directory', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      if (directories && directories.length > 0) {
        // Filter directories to only include those in the current path
        const filteredDirs = directories.filter(dir => {
          // For root path, check if directory_path is '/' or empty or null
          if (normalizedPath === '/') {
            return dir.directory_path === '/' || dir.directory_path === '' || dir.directory_path === null;
          }
          
          // For non-root paths, match the directory_path exactly
          return dir.directory_path === normalizedPath;
        });
        
        return filteredDirs;
      } else {
        return [];
      }
    } catch (dbError) {
      // Use localStorage fallback if we're in a browser environment
      if (typeof window !== 'undefined') {
        try {
          const storageKey = `files_${userId}`;
          const allFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          // Filter to only include directories
          const directories = allFiles.filter((file: FileRecord) => file.is_directory === true);
          
          // Filter directories to only include those in the current path
          const filteredDirectories = directories.filter((dir: FileRecord) => {
            const dirPath = dir.directory_path || '/';
            return dirPath === directoryPath;
          });
          
          return filteredDirectories;
        } catch (localError) {
          return [];
        }
      }
      
      return [];
    }
  },

  deleteDirectory: async (directoryId: string, userId: string, onProgress?: (status: string) => void) => {
    try {
      onProgress?.('Starting directory deletion...');
      
      // Get the directory to delete
      const { data: directory, error: dirError } = await supabase
        .from('files')
        .select('*')
        .eq('id', directoryId)
        .eq('user_id', userId)
        .eq('is_directory', true)
        .single();

      if (dirError) throw dirError;

      if (!directory) {
        throw new Error('Directory not found');
      }

      onProgress?.('Preparing to delete directory contents...');
      
      // Call the recursive function to delete the directory and all its contents
      const result = await recursiveDeleteDirectory(directory, userId, onProgress);

      onProgress?.('Directory deletion completed successfully');
      return true;
    } catch (error) {
      console.error('Error deleting directory:', error);
      onProgress?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },

  renameDirectory: async (directoryId: string, newName: string, userId: string) => {
    try {
      // Sanitize directory name
      const sanitizedName = newName.replace(/[^a-zA-Z0-9-_]/g, '_');
      
      // Try to rename directory in the database
      try {
        // First, get the directory to rename
        const { data: directory, error: dirError } = await supabase
          .from('files')
          .select('*')
          .eq('id', directoryId)
          .eq('user_id', userId)
          .eq('is_directory', true)
          .single();
        
        if (dirError) throw dirError;
        
        // Create the new path
        const parentPath = directory.storage_path.replace(`${userId}/`, '').replace(/\/[^/]+$/, '');
        const newPath = parentPath === "/" 
          ? `/${sanitizedName}/` 
          : `${parentPath}${sanitizedName}/`;
        
        // Update the directory record
        const { data, error } = await supabase
          .from('files')
          .update({
            name: sanitizedName,
            storage_path: newPath,
            updated_at: new Date().toISOString()
          })
          .eq('id', directoryId)
          .eq('user_id', userId)
          .eq('is_directory', true)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update paths of all subdirectories
        const oldPath = directory.storage_path;
        const { data: subdirs, error: subdirsError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('is_directory', true)
          .like('storage_path', `${oldPath}%`);
        
        if (subdirsError) throw subdirsError;
        
        if (subdirs && subdirs.length > 0) {
          for (const subdir of subdirs) {
            const newSubdirPath = subdir.storage_path.replace(oldPath, newPath);
            const newSubdirParentPath = subdir.storage_path.replace(oldPath, newPath).replace(/\/[^/]+$/, '');
            
            await supabase
              .from('files')
              .update({
                storage_path: newSubdirPath,
                updated_at: new Date().toISOString()
              })
              .eq('id', subdir.id)
              .eq('user_id', userId)
              .eq('is_directory', true);
          }
        }
        
        // Update directory_path for all files in this directory
        const { error: filesError } = await supabase
          .from('files')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .like('storage_path', `${oldPath}%`);
        
        // Ignore error if directory_path column doesn't exist
        if (filesError && filesError.code !== '42703') {
          throw filesError;
        }
        
        return data;
      } catch (dbError) {
        // Use localStorage fallback if we're in a browser environment
        if (typeof window !== 'undefined') {
          const storageKey = `directories_${userId}`;
          const existingDirs = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          // Find the directory to rename
          const dirIndex = existingDirs.findIndex((dir: any) => dir.id === directoryId);
          
          if (dirIndex === -1) {
            throw new Error('Directory not found');
          }
          
          const directory = existingDirs[dirIndex];
          const parentPath = directory.parent_path || '/';
          const oldPath = directory.path;
          const newPath = parentPath === "/" 
            ? `/${sanitizedName}/` 
            : `${parentPath}${sanitizedName}/`;
          
          // Update the directory
          const updatedDir = {
            ...directory,
            name: sanitizedName,
            path: newPath,
            updated_at: new Date().toISOString()
          };
          
          existingDirs[dirIndex] = updatedDir;
          
          // Update paths of all subdirectories
          for (let i = 0; i < existingDirs.length; i++) {
            const dir = existingDirs[i];
            if (dir.parent_path.startsWith(oldPath)) {
              existingDirs[i] = {
                ...dir,
                path: dir.path.replace(oldPath, newPath),
                parent_path: dir.parent_path.replace(oldPath, newPath),
                updated_at: new Date().toISOString()
              };
            }
          }
          
          localStorage.setItem(storageKey, JSON.stringify(existingDirs));
          
          // Also update the UI to show the renamed directory immediately
          setTimeout(() => {
            const event = new CustomEvent('directory-renamed', { detail: updatedDir });
            window.dispatchEvent(event);
          }, 0);
          
          return updatedDir;
        }
        
        throw new Error('Cannot rename directory: directories table does not exist and localStorage is not available');
      }
    } catch (error) {
      throw error;
    }
  },

  delete: async (fileId: string, userId: string) => {
    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()
    
    if (fileError) throw fileError
    if (!file) throw new Error('File not found')
    
    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.storage_path])
    
    if (storageError) throw storageError
    
    // Delete file record from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId)
    
    if (dbError) throw dbError
    
    return true
  },

  download: async (fileId: string, userId: string) => {
    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()
    
    if (fileError) throw fileError
    if (!file) throw new Error('File not found')
    
    // Get file from storage
    const { data, error: storageError } = await supabase.storage
      .from('files')
      .download(file.storage_path)
    
    if (storageError) throw storageError
    if (!data) throw new Error('File download failed')
    
    return { blob: data, fileName: file.name }
  },

  downloadAsZip: async (fileIds: string[], directoryIds: string[], userId: string, currentPath: string) => {
    const zip = new JSZip()
    
    // Add files to the ZIP
    if (fileIds.length > 0) {
      // Get file records
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds)
        .eq('user_id', userId)
        .eq('is_directory', false);
      
      if (filesError) throw filesError
      
      if (files) {
        for (const file of files) {
          // Download each file
          const { data, error } = await supabase.storage
            .from('files')
            .download(file.storage_path)
          
          if (error) throw error
          
          // Add to ZIP with relative path
          const relativePath = file.storage_path.replace(`${userId}${currentPath}`, '').replace(/^\/+/, '');
          const zipEntryPath = currentPath === "/" ? relativePath : `${currentPath}/${relativePath}`;
          zip.file(zipEntryPath, data)
        }
      }
    }
    
    // Add directories to the ZIP
    if (directoryIds.length > 0) {
      for (const dirId of directoryIds) {
        // Get directory record
        const { data: directory, error: dirError } = await supabase
          .from('files')
          .select('*')
          .eq('id', dirId)
          .eq('user_id', userId)
          .eq('is_directory', true)
          .single()
        
        if (dirError) throw dirError
        
        // Create a folder in the ZIP
        const dirName = directory.name
        
        // Get all files in this directory and subdirectories
        const { data: dirFiles, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('is_directory', false)
          .like('storage_path', `${directory.storage_path}%`);
        
        if (filesError) throw filesError
        
        if (dirFiles) {
          for (const file of dirFiles) {
            // Download each file
            const { data, error } = await supabase.storage
              .from('files')
              .download(file.storage_path)
            
            if (error) {
              continue
            }
            
            // Add to ZIP with relative path
            const relativePath = file.storage_path.replace(directory.storage_path, '').replace(/^\/+/, '');
            const zipEntryPath = directory.storage_path === `${userId}/` ? relativePath : `${dirName}/${relativePath}`;
            zip.file(zipEntryPath, data)
          }
        }
        
        // Get all subdirectories
        const { data: subdirs, error: subdirsError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('is_directory', true)
          .like('storage_path', `${directory.storage_path}%`);
        
        if (subdirsError) throw subdirsError
        
        if (subdirs && subdirs.length > 0) {
          // Create empty folders for each subdirectory
          for (const subdir of subdirs) {
            const relativePath = subdir.storage_path.replace(directory.storage_path, '').replace(/^\/+/, '').replace(/\/+$/, '');
            if (relativePath) { // Don't create folder for the directory itself
              const zipFolderPath = directory.storage_path === `${userId}/` ? relativePath : `${dirName}/${relativePath}`;
              zip.folder(zipFolderPath);
            }
          }
        }
      }
    }
    
    // Generate the ZIP file
    const blob = await zip.generateAsync({ type: 'blob' })
    const zipName = `cleanfs_${new Date().toISOString().slice(0, 10)}.zip`
    
    return { blob, zipName }
  },
  
  // Dashboard functions
  getStorageUsage: async (userId: string) => {
    try {
      // Get all files for the user
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .neq('type', 'directory');
        
      if (error) {
        throw error;
      }
      
      // Calculate total size
      const totalSizeBytes = data.reduce((total, file) => total + file.size, 0);
      const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);
      
      // Group files by type
      const fileTypes = {
        "Documents": ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx"],
        "Images": ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"],
        "Audio": ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
        "Video": ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"],
        "Archives": ["zip", "rar", "7z", "tar", "gz"]
      };
      
      const breakdown = Object.entries(fileTypes).map(([type, extensions]) => {
        const typeFiles = data.filter(file => {
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          return extensions.includes(ext);
        });
        
        const typeSizeBytes = typeFiles.reduce((total, file) => total + file.size, 0);
        const typeSizeGB = typeSizeBytes / (1024 * 1024 * 1024);
        
        return {
          type,
          size: typeSizeGB
        };
      });
      
      return {
        total: 100, // GB
        used: totalSizeGB,
        breakdown
      };
    } catch (error) {
      // Return default values on error
      return {
        total: 100, // GB
        used: 0,
        breakdown: []
      };
    }
  },
  
  getRecentFiles: async (userId: string, limit: number = 5) => {
    try {
      // Try to get files from Supabase first
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .neq('type', 'directory')
        .order('updated_at', { ascending: false })
        .limit(limit);
          
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      return [];
    }
  },
  
  // Create a backup of all user files
  async createBackup(userId: string): Promise<string> {
    // Get all files for the user
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
    
    if (filesError) throw filesError
    
    // Get all directories for the user
    const { data: directories, error: dirsError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .eq('is_directory', true)
    
    if (dirsError) throw dirsError
    
    // Create a backup record
    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .insert({
        user_id: userId,
        file_count: files?.length || 0,
        directory_count: directories?.length || 0,
        status: 'completed'
      })
      .select()
      .single()
    
    if (backupError) throw backupError
    
    return backup.id
  },
  
  // List all backups for a user
  async listBackups(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data || []
  },
  
  // Download a backup
  async downloadBackup(backupId: string, userId: string): Promise<{ blob: Blob, fileName: string }> {
    // Get the backup record
    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .eq('user_id', userId)
      .single()
    
    if (backupError) throw backupError
    
    // Get all files for the user
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
    
    if (filesError) throw filesError
    
    const zip = new JSZip()
    
    if (files) {
      for (const file of files) {
        try {
          // Download each file
          const { data, error } = await supabase.storage
            .from('files')
            .download(file.storage_path)
          
          if (error) {
            continue
          }
          
          // Add to ZIP with relative path
          zip.file(`${file.storage_path.replace(`${userId}/`, '')}`, data)
        } catch (err) {
          // Continue with other files
        }
      }
    }
    
    // Generate the ZIP file
    const blob = await zip.generateAsync({ type: 'blob' })
    const fileName = `cleanfs_backup_${new Date(backup.created_at).toISOString().slice(0, 10)}.zip`
    
    return { blob, fileName }
  }
}

// Export the files object
export const files = filesObj;

// Sharing module for file sharing
export const sharing = {
  /**
   * Create a share link for a file
   * @param userId User ID
   * @param shareData Share data including fileId, expiresAt, and password
   * @returns The created share object
   */
  async create(userId: string, shareData: {
    fileId: string;
    expiresAt: string | null;
    password: string | null;
  }) {
    try {
      // Get file details
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('name, type') // Select name and mime type
        .eq('id', shareData.fileId)
        .eq('user_id', userId)
        .eq('is_directory', false) // Ensure it's a file
        .single();
      
      if (fileError) throw fileError;
      
      // Generate a unique share ID
      const shareId = generateUniqueId();
      
      // Create the share record
      const shareRecord = {
        id: shareId,
        user_id: userId,
        file_id: shareData.fileId, // This should be a UUID
        file_name: fileData.name,
        file_type: fileData.type,
        url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/s/${shareId}`,
        created_at: new Date().toISOString(),
        expires_at: shareData.expiresAt,
        is_password_protected: !!shareData.password,
        password_hash: shareData.password ? await hashPassword(shareData.password) : null,
        access_count: 0
      };
      
      const { data, error } = await supabase
        .from('shares')
        .insert(shareRecord)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      throw error;
    }
  },
  
  /**
   * List all shares for a user
   * @param userId User ID
   * @returns Array of share objects
   */
  async listShares(userId: string) {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      return [];
    }
  },
  
  /**
   * Delete a share
   * @param shareId Share ID
   * @param userId User ID
   * @returns Success status
   */
  async deleteShare(shareId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get a list of files that can be shared
   * @param userId User ID
   * @returns Array of file objects
   */
  async getShareableFiles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('id, name, type') // Select id, name, and mime type
        .eq('user_id', userId)
        .eq('is_directory', false) // Filter for files only
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      return [];
    }
  },
  
  /**
   * Get a shared file by share ID
   * @param shareId Share ID
   * @param password Optional password for protected shares
   * @returns The file data or null if not found or password incorrect
   */
  async getSharedFile(shareId: string, password?: string) {
    try {
      // Get the share record
      const { data: shareData, error: shareError } = await supabase
        .from('shares')
        .select('*')
        .eq('id', shareId)
        .single();
      
      if (shareError) throw shareError;
      
      // Check if share has expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        throw new Error('Share link has expired');
      }
      
      // Check password if required
      if (shareData.is_password_protected && password) {
        const passwordValid = await verifyPassword(password, shareData.password_hash);
        if (!passwordValid) {
          throw new Error('Incorrect password');
        }
      } else if (shareData.is_password_protected && !password) {
        throw new Error('Password required');
      }
      
      // Increment access count
      await supabase
        .from('shares')
        .update({ access_count: shareData.access_count + 1 })
        .eq('id', shareId);
      
      // Get the file data
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', shareData.file_id)
        .single();
      
      if (fileError) throw fileError;
      
      return { file: fileData, share: shareData };
    } catch (error) {
      throw error;
    }
  }
};

// Helper function to generate a unique ID for shares
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Helper function to hash a password
async function hashPassword(password: string) {
  // In a real app, use a proper hashing library like bcrypt
  // This is a simple placeholder
  return password;
}

// Helper function to verify a password
async function verifyPassword(password: string, hash: string) {
  // In a real app, use a proper verification method
  // This is a simple placeholder
  return password === hash;
}

// User Profile Management
export const profile = {
  update: async (userId: string, updates: { name?: string }) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  get: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },
  
  getSettings: async (userId: string) => {
    try {
      // Try to get settings from Supabase first
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
          
      if (error) {
        throw error;
      }
      
      // Convert snake_case from database to camelCase for JavaScript
      return {
        theme: data.theme || 'system',
        notifications: data.notifications !== undefined ? data.notifications : true,
        compressFiles: data.compress_files || false,
      };
    } catch (dbError) {
      console.error('Error getting user settings:', dbError);
      
      // Default settings
      return {
        theme: 'system',
        notifications: true,
        compressFiles: false,
      };
    }
  },
  
  updateSettings: async (userId: string, settings: any) => {
    try {
      // Convert camelCase to snake_case for database
      const dbSettings: Record<string, any> = {
        user_id: userId,
      };
      
      // Map JavaScript camelCase to database snake_case
      if (settings.theme !== undefined) dbSettings.theme = settings.theme;
      if (settings.notifications !== undefined) dbSettings.notifications = settings.notifications;
      if (settings.compressFiles !== undefined) dbSettings.compress_files = settings.compressFiles;
      
      // Check if settings already exist for this user
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            ...dbSettings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('user_settings')
          .insert({
            ...dbSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Helper function to get MIME type from file extension
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: {[key: string]: string} = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'zip': 'application/zip',
    'json': 'application/json',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Settings module for managing user preferences
export const settings = {
  /**
   * Get user settings from Supabase
   * @param userId User ID
   * @returns User settings object or null if not found
   */
  getUserSettings: async (userId: string) => {
    try {
      // Try to get settings from Supabase first
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
          
      if (error) {
        throw error;
      }
      
      // Convert snake_case from database to camelCase for JavaScript
      return {
        theme: data.theme || 'system',
        notifications: data.notifications !== undefined ? data.notifications : true,
        compressFiles: data.compress_files || false,
      };
    } catch (dbError) {
      console.error('Error getting user settings:', dbError);
      
      // Default settings
      return {
        theme: 'system',
        notifications: true,
        compressFiles: false,
      };
    }
  },
  
  /**
   * Update user settings in Supabase
   * @param userId User ID
   * @param settings Settings object to save
   * @returns Success status
   */
  updateUserSettings: async (userId: string, settings: any) => {
    try {
      // Convert camelCase to snake_case for database
      const dbSettings: Record<string, any> = {
        user_id: userId,
      };
      
      // Map JavaScript camelCase to database snake_case
      if (settings.theme !== undefined) dbSettings.theme = settings.theme;
      if (settings.notifications !== undefined) dbSettings.notifications = settings.notifications;
      if (settings.compressFiles !== undefined) dbSettings.compress_files = settings.compressFiles;
      
      // Check if settings already exist for this user
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            ...dbSettings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('user_settings')
          .insert({
            ...dbSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Recursive function to delete a directory and all its contents
async function recursiveDeleteDirectory(directory: any, userId: string, onProgress?: (status: string) => void) {
  try {
    // Log the directory being processed
    console.log(`Processing directory: ${directory.name} (${directory.id}) at path: ${directory.storage_path}`);
    onProgress?.(`Processing directory: ${directory.name}`);
    
    // Get all files in this directory
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .eq('directory_path', directory.storage_path)
      .eq('is_directory', false);

    if (filesError) {
      console.error(`Error fetching files in directory ${directory.id}:`, filesError);
      throw filesError;
    }

    if (files && files.length > 0) {
      onProgress?.(`Deleting ${files.length} files from ${directory.name}...`);
      console.log(`Found ${files.length} files to delete in directory ${directory.name}`);
      
      // Create an array of storage paths to delete
      const storagePaths = files.map(file => file.storage_path);
      
      // Delete files from storage bucket in batches
      const batchSize = 100;
      for (let i = 0; i < storagePaths.length; i += batchSize) {
        const batch = storagePaths.slice(i, i + batchSize);
        console.log(`Deleting batch of ${batch.length} files from storage`);
        
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove(batch);
        
        if (storageError) {
          console.error(`Error deleting files from storage in directory ${directory.name}:`, storageError);
          // Continue with deletion even if storage deletion fails
        }
      }

      // Delete all files from the database
      console.log(`Deleting ${files.length} files from database for directory ${directory.name}`);
      const { error: deleteFilesError } = await supabase
        .from('files')
        .delete()
        .eq('user_id', userId)
        .eq('directory_path', directory.storage_path)
        .eq('is_directory', false);

      if (deleteFilesError) {
        console.error(`Error deleting files from database in directory ${directory.name}:`, deleteFilesError);
        throw deleteFilesError;
      }
    }

    // Get all subdirectories
    console.log(`Fetching subdirectories for ${directory.name} with path ${directory.storage_path}`);
    const { data: subdirs, error: subdirsError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .eq('is_directory', true)
      .like('storage_path', `${directory.storage_path}%`)
      .neq('id', directory.id); // Exclude the current directory to avoid infinite recursion

    if (subdirsError) {
      console.error(`Error fetching subdirectories for ${directory.name}:`, subdirsError);
      throw subdirsError;
    }

    if (subdirs && subdirs.length > 0) {
      // Sort subdirectories by path length in descending order to delete deepest directories first
      subdirs.sort((a, b) => b.storage_path.length - a.storage_path.length);
      
      console.log(`Found ${subdirs.length} subdirectories to delete in ${directory.name}`);
      onProgress?.(`Deleting ${subdirs.length} subdirectories from ${directory.name}...`);
      
      // Use a for...of loop for async operations
      for (const subdir of subdirs) {
        console.log(`Recursively deleting subdirectory: ${subdir.name} (${subdir.id})`);
        // Call this function recursively
        await recursiveDeleteDirectory(subdir, userId, onProgress);
      }
    }

    // Finally, delete the directory itself from the database
    console.log(`Deleting directory ${directory.name} (${directory.id}) from database`);
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', directory.id)
      .eq('user_id', userId)
      .eq('is_directory', true);

    if (deleteError) {
      console.error(`Error deleting directory ${directory.name} from database:`, deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted directory ${directory.name} (${directory.id})`);
    return true;
  } catch (error) {
    console.error(`Error in recursive directory deletion for ${directory?.name || 'unknown'}:`, error);
    throw error;
  }
}
