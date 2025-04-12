-- Update RLS policies for the files table to handle both files and directories

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

-- Create updated policies that handle both files and directories
CREATE POLICY "Users can view their own files and directories" 
  ON public.files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files and directories" 
  ON public.files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files and directories" 
  ON public.files FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files and directories" 
  ON public.files FOR DELETE 
  USING (auth.uid() = user_id);
