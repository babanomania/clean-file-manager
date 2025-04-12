-- Create shares table for file sharing functionality
CREATE TABLE IF NOT EXISTS public.shares (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_password_protected BOOLEAN DEFAULT false NOT NULL,
  password_hash TEXT,
  access_count INTEGER DEFAULT 0 NOT NULL
);

-- Add RLS policies for the shares table
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own shares
CREATE POLICY "Users can view their own shares"
ON public.shares
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own shares
CREATE POLICY "Users can insert their own shares"
ON public.shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own shares
CREATE POLICY "Users can update their own shares"
ON public.shares
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
ON public.shares
FOR DELETE
USING (auth.uid() = user_id);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS shares_user_id_idx ON public.shares(user_id);

-- Create an index on file_id for faster queries
CREATE INDEX IF NOT EXISTS shares_file_id_idx ON public.shares(file_id);
