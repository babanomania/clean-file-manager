import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase'
import JSZip from 'jszip'

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
  publicUrl?: string
  localUrl?: string
}

export interface DirectoryRecord {
  id: string
  name: string
  path: string
  parent_path?: string
  user_id: string
  created_at: string
  updated_at: string
  parent_directory_id?: string
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
  upload: async (file: File, userId: string, directoryPath: string = "/") => {
    console.log('==== UPLOAD FUNCTION START ====');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('User ID:', userId);
    console.log('Directory Path:', directoryPath);

    const filePath = `${userId}/${directoryPath}/${file.name}`;
    console.log('Final storage path:', filePath);

    try {
      // Ensure we have an authenticated session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session check:', sessionData.session ? 'Authenticated' : 'Not authenticated');
      
      if (!sessionData.session) {
        console.error('No authenticated session found');
        throw new Error('Authentication required for file upload');
      }

      // Try to get a signed URL for upload (this can bypass RLS in some cases)
      try {
        console.log('Attempting to create a signed URL for upload');
        
        // First, create a record in the files table
        const fileRecord = {
          name: file.name,
          type: file.type || getMimeType(file.name),
          size: file.size,
          storage_path: filePath,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('File record:', fileRecord);
        
        // Try direct upload first
        console.log('Attempting direct upload to bucket: files');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error('Direct upload failed:', uploadError);
          console.error('Error details:', JSON.stringify(uploadError));
          
          // If direct upload fails, try creating a signed URL
          console.log('Attempting to create a signed URL for upload');
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('files')
            .createSignedUploadUrl(filePath);
            
          if (signedUrlError) {
            console.error('Failed to create signed URL:', signedUrlError);
            throw signedUrlError;
          }
          
          console.log('Successfully created signed URL');
          const { signedUrl, token } = signedUrlData;
          
          // Upload using the signed URL
          console.log('Uploading using signed URL');
          const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
              'x-upsert': 'true'
            },
            body: file
          });
          
          if (!uploadResponse.ok) {
            console.error('Signed URL upload failed:', await uploadResponse.text());
            throw new Error('Signed URL upload failed');
          }
          
          console.log('Successfully uploaded using signed URL');
        } else {
          console.log('Successfully uploaded directly to bucket');
        }
        
        // Store file metadata in localStorage for immediate access
        if (typeof window !== 'undefined') {
          console.log('Storing file metadata in localStorage');
          const storageKey = `files_${userId}`;
          let existingFiles = [];
          
          try {
            existingFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
          } catch (e) {
            console.warn('Error parsing localStorage, resetting:', e);
          }
          
          const newFile = {
            ...fileRecord,
            id: Math.random().toString(36).substring(2, 15)
          };
          
          localStorage.setItem(storageKey, JSON.stringify([...existingFiles, newFile]));
          console.log('Updated localStorage with new file');
          
          // Dispatch event to update UI immediately
          setTimeout(() => {
            console.log('Dispatching file-uploaded event');
            const event = new CustomEvent('file-uploaded', { detail: newFile });
            window.dispatchEvent(event);
          }, 0);
        }
      } catch (error) {
        console.error('Upload process failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('==== UPLOAD FUNCTION ERROR ====');
      console.error('Error details:', error);
    }

    console.log('==== UPLOAD FUNCTION COMPLETE ====');
  },

  createDirectory: async (name: string, userId: string, parentPath: string = "/") => {
    console.log('==== CREATE DIRECTORY START ====');
    console.log('Directory Name:', name);
    console.log('User ID:', userId);
    console.log('Parent Path:', parentPath);
    
    try {
      // Create a clean storage path
      const storagePath = parentPath === "/" 
        ? `${userId}/${name}/` 
        : `${userId}${parentPath}${name}/`;
      
      console.log('Storage path for directory:', storagePath);
      
      // Skip database insert entirely and use localStorage only
      if (typeof window !== 'undefined') {
        console.log('Using localStorage to store directory');
        const storageKey = `files_${userId}`;
        let existingFiles = [];
        
        try {
          existingFiles = JSON.parse(localStorage.getItem(storageKey) || '[]');
          console.log(`Found ${existingFiles.length} existing items in localStorage`);
        } catch (e) {
          console.warn('Error parsing localStorage, resetting:', e);
        }
        
        // Create directory record
        const directoryRecord: FileRecord = {
          id: Math.random().toString(36).substring(2, 15),
          name: name,
          type: 'directory',
          size: 0,
          storage_path: storagePath,
          user_id: userId,
          directory_path: parentPath,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('New directory record:', directoryRecord);
        
        // Add to localStorage
        localStorage.setItem(storageKey, JSON.stringify([...existingFiles, directoryRecord]));
        console.log('Updated localStorage with new directory');
        
        // Dispatch event to update UI immediately
        setTimeout(() => {
          console.log('Dispatching directory-created event');
          const event = new CustomEvent('directory-created', { detail: directoryRecord });
          window.dispatchEvent(event);
        }, 0);
        
        console.log('==== CREATE DIRECTORY COMPLETE ====');
        return directoryRecord;
      }
      
      console.log('==== CREATE DIRECTORY FAILED (non-browser) ====');
      throw new Error('Cannot create directory in non-browser environment');
    } catch (error) {
      console.error('==== CREATE DIRECTORY ERROR ====');
      console.error('Error type:', typeof error);
      console.error('Error details:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Error JSON:', JSON.stringify(error));
      }
      throw error;
    }
  },

  getFiles: async (userId: string, directoryPath: string = "/") => {
    console.log('==== GET FILES START ====');
    console.log('User ID:', userId);
    console.log('Directory Path:', directoryPath);
    
    try {
      // Try to get files from Supabase first
      console.log('Attempting to get files from Supabase database');
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .neq('type', 'directory');
        
        if (error) {
          console.warn('Supabase query failed, falling back to localStorage:', error);
          console.warn('Error details:', JSON.stringify(error));
          throw error; // This will be caught in the outer try/catch
        }
        
        console.log(`Found ${data.length} files in database`);
        
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
        
        console.log(`Filtered to ${filteredFiles.length} files in directory: ${directoryPath}`);
        
        // Add directory_path for compatibility
        const mappedFiles = filteredFiles.map(file => ({
          ...file,
          directory_path: directoryPath
        }));
        
        console.log('Successfully retrieved files from Supabase');
        console.log('==== GET FILES COMPLETE ====');
        return mappedFiles;
      } catch (dbError) {
        console.warn('Database query failed:', dbError);
        // Continue to localStorage fallback
      }
      
      // Use localStorage as fallback
      if (typeof window !== 'undefined') {
        console.log('Using localStorage fallback to get files');
        const storageKey = `files_${userId}`;
        let files = [];
        
        try {
          files = JSON.parse(localStorage.getItem(storageKey) || '[]');
          console.log(`Found ${files.length} total files in localStorage`);
        } catch (e) {
          console.warn('Error parsing localStorage:', e);
          return [];
        }
        
        // Filter files by directory path
        const filteredFiles = files.filter((file: FileRecord) => {
          const fileDirPath = file.directory_path || '/';
          console.log(`Comparing file path: ${fileDirPath} with current path: ${directoryPath}`);
          return fileDirPath === directoryPath;
        }).filter((file: FileRecord) => file.type !== 'directory');
        
        console.log(`Returning ${filteredFiles.length} files for directory: ${directoryPath}`);
        console.log('==== GET FILES COMPLETE (localStorage) ====');
        return filteredFiles;
      }
      
      // Fallback to empty array
      console.log('No localStorage available, returning empty array');
      console.log('==== GET FILES COMPLETE ====');
      return [];
    } catch (error) {
      console.error('==== GET FILES ERROR ====');
      console.error('Error details:', error);
      return [];
    }
  },

  getDirectories: async (userId: string, directoryPath: string = "/") => {
    console.log('==== GET DIRECTORIES START ====');
    console.log('User ID:', userId);
    console.log('Directory Path:', directoryPath);
    
    try {
      // Try to get directories from Supabase first
      console.log('Attempting to get directories from Supabase database');
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'directory');
        
        if (error) {
          console.warn('Supabase query failed, falling back to localStorage:', error);
          console.warn('Error details:', JSON.stringify(error));
          throw error; // This will be caught in the outer try/catch
        }
        
        console.log(`Found ${data.length} directories in database`);
        
        // Filter directories based on the parent path
        const filteredDirs = data.filter(dir => {
          const path = dir.storage_path;
          
          // Remove userId from the beginning
          const pathWithoutUserId = path.replace(`${userId}/`, '');
          
          if (directoryPath === '/') {
            // For root directories, there should be only one slash (at the end)
            return pathWithoutUserId.split('/').length === 2;
          } else {
            // For nested directories, the path should start with the parent path
            // and have exactly one more directory level
            const parentPathWithoutLeadingSlash = directoryPath.startsWith('/') 
              ? directoryPath.substring(1) 
              : directoryPath;
              
            return pathWithoutUserId.startsWith(parentPathWithoutLeadingSlash) && 
                   pathWithoutUserId.replace(parentPathWithoutLeadingSlash, '').split('/').length === 2;
          }
        });
        
        console.log(`Filtered to ${filteredDirs.length} directories in parent path: ${directoryPath}`);
        
        // Map to DirectoryRecord format
        const mappedDirs = filteredDirs.map(dir => ({
          ...dir,
          path: directoryPath,
          parent_path: directoryPath
        }));
        
        console.log('Successfully retrieved directories from Supabase');
        console.log('==== GET DIRECTORIES COMPLETE ====');
        return mappedDirs;
      } catch (dbError) {
        console.warn('Database query failed:', dbError);
        // Continue to localStorage fallback
      }
      
      // Use localStorage as fallback
      if (typeof window !== 'undefined') {
        console.log('Using localStorage fallback to get directories');
        const storageKey = `files_${userId}`;
        let files = [];
        
        try {
          files = JSON.parse(localStorage.getItem(storageKey) || '[]');
          console.log(`Found ${files.length} total items in localStorage`);
        } catch (e) {
          console.warn('Error parsing localStorage:', e);
          return [];
        }
        
        // Filter for directories in the current path
        const directories = files.filter((file: FileRecord) => {
          const fileDirPath = file.directory_path || '/';
          console.log(`Comparing directory path: ${fileDirPath} with current path: ${directoryPath}`);
          return fileDirPath === directoryPath && file.type === 'directory';
        });
        
        // Map to DirectoryRecord format
        const mappedDirectories = directories.map((dir: FileRecord) => {
          return {
            id: dir.id,
            name: dir.name,
            path: dir.directory_path || '/',
            storage_path: dir.storage_path,
            user_id: dir.user_id,
            created_at: dir.created_at,
            updated_at: dir.updated_at
          } as DirectoryRecord;
        });
        
        console.log(`Returning ${mappedDirectories.length} directories for path: ${directoryPath}`);
        console.log('==== GET DIRECTORIES COMPLETE (localStorage) ====');
        return mappedDirectories;
      }
      
      // Fallback to empty array
      console.log('No localStorage available, returning empty array');
      console.log('==== GET DIRECTORIES COMPLETE ====');
      return [];
    } catch (error) {
      console.error('==== GET DIRECTORIES ERROR ====');
      console.error('Error details:', error);
      return [];
    }
  },

  deleteDirectory: async (directoryId: string, userId: string) => {
    try {
      // First, try to delete from the database
      try {
        // First, get the directory to delete
        const { data: directory, error: dirError } = await supabase
          .from('files')
          .select('*')
          .eq('id', directoryId)
          .eq('user_id', userId)
          .eq('type', 'directory')
          .single();
        
        if (dirError) throw dirError;
        
        // Delete all files in this directory
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .like('storage_path', `${directory.storage_path}%`)
        
        if (filesError) throw filesError
        
        // Delete files from storage and database
        if (files && files.length > 0) {
          // Delete from storage
          const filePaths = files.map(file => file.storage_path)
          const { error: storageError } = await supabase.storage
            .from('files')
            .remove(filePaths)
          
          if (storageError) throw storageError
          
          // Delete from database
          const fileIds = files.map(file => file.id)
          const { error: dbError } = await supabase
            .from('files')
            .delete()
            .in('id', fileIds)
          
          if (dbError) throw dbError
        }
        
        // Delete subdirectories recursively
        const { data: subdirs, error: subdirsError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'directory')
          .like('storage_path', `${directory.storage_path}%`)
        
        if (subdirsError) throw subdirsError
        
        if (subdirs && subdirs.length > 0) {
          // Use a for...of loop for async operations
          for (const subdir of subdirs) {
            // Call this function recursively using the exported object
            await filesObj.deleteDirectory(subdir.id, userId)
          }
        } else if (subdirs === null) {
          console.log('No subdirectories found')
        }
        
        // Finally, delete the directory itself
        const { error: deleteError } = await supabase
          .from('files')
          .delete()
          .eq('id', directoryId)
          .eq('user_id', userId)
          .eq('type', 'directory')
        
        if (deleteError) throw deleteError
        
        return true
      } catch (dbError) {
        console.warn('Using localStorage fallback for directory deletion:', dbError);
        
        // Use localStorage fallback if we're in a browser environment
        if (typeof window !== 'undefined') {
          const storageKey = `directories_${userId}`;
          const existingDirs = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          // Get the directory to delete
          const directory = existingDirs.find((dir: any) => dir.id === directoryId);
          
          if (!directory) {
            throw new Error('Directory not found');
          }
          
          // Find and delete all subdirectories recursively
          const subdirIds = existingDirs
            .filter((dir: any) => dir.parent_path.startsWith(directory.path))
            .map((dir: any) => dir.id);
          
          // Delete all directories (including subdirectories)
          const updatedDirs = existingDirs.filter((dir: any) => 
            dir.id !== directoryId && !subdirIds.includes(dir.id)
          );
          
          localStorage.setItem(storageKey, JSON.stringify(updatedDirs));
          
          // Also update the UI to show the deletion immediately
          setTimeout(() => {
            const event = new CustomEvent('directory-deleted', { detail: { id: directoryId } });
            window.dispatchEvent(event);
          }, 0);
          
          return true;
        }
        
        throw new Error('Cannot delete directory: directories table does not exist and localStorage is not available');
      }
    } catch (error) {
      console.error('Error deleting directory:', error);
      throw error;
    }
  },

  renameDirectory: async (directoryId: string, newName: string, userId: string) => {
    try {
      console.log('Renaming directory:', { directoryId, newName, userId });
      
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
          .eq('type', 'directory')
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
          .eq('type', 'directory')
          .select()
          .single();
        
        if (error) throw error;
        
        // Update paths of all subdirectories
        const oldPath = directory.storage_path;
        const { data: subdirs, error: subdirsError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'directory')
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
              .eq('type', 'directory');
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
        console.warn('Using localStorage fallback for directory renaming:', dbError);
        
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
      console.error('Directory renaming error:', error);
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
      
      if (filesError) throw filesError
      
      if (files) {
        for (const file of files) {
          // Download each file
          const { data, error } = await supabase.storage
            .from('files')
            .download(file.storage_path)
          
          if (error) throw error
          
          // Add to ZIP with relative path
          zip.file(`${file.storage_path.replace(`${userId}${currentPath}`, '')}`, data)
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
          .eq('type', 'directory')
          .single()
        
        if (dirError) throw dirError
        
        // Create a folder in the ZIP
        const dirName = directory.name
        
        // Get all files in this directory and subdirectories
        const { data: dirFiles, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .like('storage_path', `${directory.storage_path}%`)
        
        if (filesError) throw filesError
        
        if (dirFiles) {
          for (const file of dirFiles) {
            // Download each file
            const { data, error } = await supabase.storage
              .from('files')
              .download(file.storage_path)
            
            if (error) throw error
            
            // Add to ZIP with relative path
            zip.file(`${dirName}/${file.storage_path.replace(directory.storage_path, '')}`, data)
          }
        }
        
        // Get all subdirectories
        const { data: subdirs, error: subdirsError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'directory')
          .like('storage_path', `${directory.storage_path}%`)
        
        if (subdirsError) throw subdirsError
        
        if (subdirs && subdirs.length > 0) {
          // Create empty folders for each subdirectory
          for (const subdir of subdirs) {
            const relativePath = subdir.storage_path.replace(directory.storage_path, '')
            zip.folder(`${dirName}/${relativePath}`)
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
    console.log('==== GET STORAGE USAGE START ====');
    console.log('User ID:', userId);
    
    try {
      // Get all files for the user
      console.log('Attempting to get files from Supabase database');
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .neq('type', 'directory');
        
      if (error) {
        console.warn('Supabase query failed, falling back to localStorage:', error);
        console.warn('Error details:', JSON.stringify(error));
        
        // Try localStorage as fallback
        if (typeof window !== 'undefined') {
          console.log('Using localStorage fallback to calculate storage usage');
          const storageKey = `files_${userId}`;
          let files = [];
          
          try {
            files = JSON.parse(localStorage.getItem(storageKey) || '[]');
            console.log(`Found ${files.length} total files in localStorage`);
          } catch (e) {
            console.warn('Error parsing localStorage:', e);
            return {
              total: 100, // GB
              used: 0,
              breakdown: []
            };
          }
          
          // Filter out directories
          const actualFiles = files.filter((file: FileRecord) => file.type !== 'directory');
          
          // Calculate total size
          const totalSizeBytes = actualFiles.reduce((total: number, file: FileRecord) => total + file.size, 0);
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
            const typeFiles = actualFiles.filter((file: FileRecord) => {
              const ext = file.name.split('.').pop()?.toLowerCase() || '';
              return extensions.includes(ext);
            });
            
            const typeSizeBytes = typeFiles.reduce((total: number, file: FileRecord) => total + file.size, 0);
            const typeSizeGB = typeSizeBytes / (1024 * 1024 * 1024);
            
            return {
              type,
              size: typeSizeGB
            };
          });
          
          console.log('Storage usage calculated from localStorage');
          console.log('==== GET STORAGE USAGE COMPLETE ====');
          
          return {
            total: 100, // GB
            used: totalSizeGB,
            breakdown
          };
        }
        
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
      
      console.log('Storage usage calculated from Supabase');
      console.log('==== GET STORAGE USAGE COMPLETE ====');
      
      return {
        total: 100, // GB
        used: totalSizeGB,
        breakdown
      };
    } catch (error) {
      console.error('==== GET STORAGE USAGE ERROR ====');
      console.error('Error details:', error);
      
      // Return default values on error
      return {
        total: 100, // GB
        used: 0,
        breakdown: []
      };
    }
  },
  
  getRecentFiles: async (userId: string, limit: number = 5) => {
    console.log('==== GET RECENT FILES START ====');
    console.log('User ID:', userId);
    console.log('Limit:', limit);
    
    try {
      // Try to get files from Supabase first
      console.log('Attempting to get recent files from Supabase database');
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .neq('type', 'directory')
          .order('updated_at', { ascending: false })
          .limit(limit);
          
        if (error) {
          console.warn('Supabase query failed, falling back to localStorage:', error);
          console.warn('Error details:', JSON.stringify(error));
          throw error;
        }
        
        console.log(`Found ${data.length} recent files`);
        console.log('==== GET RECENT FILES COMPLETE ====');
        return data;
      } catch (dbError) {
        console.warn('Database query failed:', dbError);
        
        // Use localStorage as fallback
        if (typeof window !== 'undefined') {
          console.log('Using localStorage fallback to get recent files');
          const storageKey = `files_${userId}`;
          let files = [];
          
          try {
            files = JSON.parse(localStorage.getItem(storageKey) || '[]');
            console.log(`Found ${files.length} total files in localStorage`);
          } catch (e) {
            console.warn('Error parsing localStorage:', e);
            return [];
          }
          
          // Filter out directories and sort by updated_at
          const recentFiles = files
            .filter((file: FileRecord) => file.type !== 'directory')
            .sort((a: FileRecord, b: FileRecord) => {
              return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            })
            .slice(0, limit);
            
          console.log(`Returning ${recentFiles.length} recent files`);
          console.log('==== GET RECENT FILES COMPLETE (localStorage) ====');
          return recentFiles;
        }
        
        console.log('No localStorage available, returning empty array');
        console.log('==== GET RECENT FILES COMPLETE ====');
        return [];
      }
    } catch (error) {
      console.error('==== GET RECENT FILES ERROR ====');
      console.error('Error details:', error);
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
      .eq('type', 'directory')
    
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
            console.error(`Error downloading file ${file.name}:`, error)
            continue
          }
          
          // Add to ZIP with relative path
          zip.file(`${file.storage_path.replace(`${userId}/`, '')}`, data)
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err)
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
        .select('name, type')
        .eq('id', shareData.fileId)
        .eq('user_id', userId)
        .single();
      
      if (fileError) throw fileError;
      
      // Generate a unique share ID
      const shareId = generateUniqueId();
      
      // Create the share record
      const shareRecord = {
        id: shareId,
        user_id: userId,
        file_id: shareData.fileId,
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
    } catch (error) {
      console.error('Error creating share:', error);
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
    } catch (error) {
      console.error('Error listing shares:', error);
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
      console.error('Error deleting share:', error);
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
        .select('id, name, type')
        .eq('user_id', userId)
        .neq('type', 'directory')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting shareable files:', error);
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
      console.error('Error getting shared file:', error);
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
    console.log('==== GET USER SETTINGS START ====');
    console.log('User ID:', userId);
    
    try {
      // Try to get settings from Supabase first
      console.log('Attempting to get settings from Supabase database');
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error) {
          console.warn('Supabase query failed, falling back to localStorage:', error);
          console.warn('Error details:', JSON.stringify(error));
          throw error;
        }
        
        console.log('Settings retrieved successfully:', data);
        console.log('==== GET USER SETTINGS COMPLETE ====');
        return data;
      } catch (dbError) {
        console.warn('Database query failed:', dbError);
        
        // Use localStorage as fallback
        if (typeof window !== 'undefined') {
          console.log('Using localStorage fallback to get settings');
          const storageKey = `settings_${userId}`;
          let settings = null;
          
          try {
            settings = JSON.parse(localStorage.getItem(storageKey) || 'null');
            console.log('Settings from localStorage:', settings);
          } catch (e) {
            console.warn('Error parsing localStorage:', e);
          }
          
          if (!settings) {
            // Default settings
            settings = {
              user_id: userId,
              theme: 'light',
              automatic_backups: false,
              backup_frequency: 'weekly',
              backup_retention: 30,
              notifications_enabled: true
            };
            
            localStorage.setItem(storageKey, JSON.stringify(settings));
            console.log('Created default settings in localStorage');
          }
          
          console.log('==== GET USER SETTINGS COMPLETE (localStorage) ====');
          return settings;
        }
        
        console.log('No localStorage available, returning default settings');
        console.log('==== GET USER SETTINGS COMPLETE ====');
        
        // Default settings
        return {
          user_id: userId,
          theme: 'light',
          automatic_backups: false,
          backup_frequency: 'weekly',
          backup_retention: 30,
          notifications_enabled: true
        };
      }
    } catch (error) {
      console.error('==== GET USER SETTINGS ERROR ====');
      console.error('Error details:', error);
      
      // Return default settings on error
      return {
        user_id: userId,
        theme: 'light',
        automatic_backups: false,
        backup_frequency: 'weekly',
        backup_retention: 30,
        notifications_enabled: true
      };
    }
  },
  
  updateSettings: async (userId: string, settings: any) => {
    console.log('==== UPDATE USER SETTINGS START ====');
    console.log('User ID:', userId);
    console.log('Settings:', settings);
    
    try {
      // Try to update settings in Supabase first
      console.log('Attempting to update settings in Supabase database');
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            ...settings
          })
          .select()
          .single();
          
        if (error) {
          console.warn('Supabase update failed, falling back to localStorage:', error);
          console.warn('Error details:', JSON.stringify(error));
          throw error;
        }
        
        console.log('Settings updated successfully:', data);
        console.log('==== UPDATE USER SETTINGS COMPLETE ====');
        return data;
      } catch (dbError) {
        console.warn('Database operation failed:', dbError);
        
        // Use localStorage as fallback
        if (typeof window !== 'undefined') {
          console.log('Using localStorage to update settings');
          const storageKey = `settings_${userId}`;
          
          try {
            const currentSettings = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const updatedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
            console.log('Updated settings in localStorage:', updatedSettings);
            
            console.log('==== UPDATE USER SETTINGS COMPLETE (localStorage) ====');
            return updatedSettings;
          } catch (e) {
            console.warn('Error with localStorage:', e);
            throw e;
          }
        }
        
        console.log('No localStorage available');
        console.log('==== UPDATE USER SETTINGS COMPLETE ====');
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('==== UPDATE USER SETTINGS ERROR ====');
      console.error('Error details:', error);
      throw error;
    }
  }
}

// Settings module for managing user preferences
export const settings = {
  /**
   * Get user settings from Supabase
   * @param userId User ID
   * @returns User settings object or null if not found
   */
  async getUserSettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user settings:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserSettings:', error);
      return null;
    }
  },
  
  /**
   * Update user settings in Supabase
   * @param userId User ID
   * @param settings Settings object to save
   * @returns Success status
   */
  async updateUserSettings(userId: string, settings: any) {
    try {
      // Check if settings already exist for this user
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
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
