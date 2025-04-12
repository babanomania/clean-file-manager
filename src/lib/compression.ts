/**
 * Utility functions for file compression
 */
import JSZip from 'jszip';

/**
 * Compress a file using JSZip
 * @param file Original file to compress
 * @returns Promise resolving to the compressed file
 */
export async function compressFile(file: File): Promise<File> {
  // Skip compression for already compressed file types
  const compressedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
    'application/x-7z-compressed', 'application/gzip', 'application/x-gzip',
    'video/mp4', 'video/mpeg', 'video/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg'
  ];
  
  if (compressedTypes.includes(file.type)) {
    // Return the original file for already compressed formats
    return file;
  }
  
  try {
    const zip = new JSZip();
    
    // Add the file to the zip
    zip.file(file.name, file);
    
    // Generate the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Create a new File object from the zip content
    const compressedFile = new File(
      [content], 
      `${file.name}.zip`, 
      { type: 'application/zip' }
    );
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing file:', error);
    // Return the original file if compression fails
    return file;
  }
}
