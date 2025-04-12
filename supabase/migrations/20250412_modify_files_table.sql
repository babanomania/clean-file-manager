-- Add directory-specific columns to files table
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS directory_path TEXT,
ADD COLUMN IF NOT EXISTS parent_directory_id UUID,
ADD COLUMN IF NOT EXISTS is_directory BOOLEAN DEFAULT FALSE;

-- Create index on directory_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_directory_path ON public.files(directory_path);

-- Create index on is_directory for faster filtering
CREATE INDEX IF NOT EXISTS idx_files_is_directory ON public.files(is_directory);
