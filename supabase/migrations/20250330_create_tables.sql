-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies for files table
CREATE POLICY "Users can view their own files" 
  ON public.files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files" 
  ON public.files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" 
  ON public.files FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
  ON public.files FOR DELETE 
  USING (auth.uid() = user_id);

-- Create file_shares table
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('temporary', 'permanent')),
  share_link TEXT NOT NULL UNIQUE,
  expiry_date TIMESTAMPTZ,
  password TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on file_shares table
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for file_shares table
CREATE POLICY "Users can view their own file shares" 
  ON public.file_shares FOR SELECT 
  USING (file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own file shares" 
  ON public.file_shares FOR INSERT 
  WITH CHECK (file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own file shares" 
  ON public.file_shares FOR UPDATE 
  USING (file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own file shares" 
  ON public.file_shares FOR DELETE 
  USING (file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid()));

-- Allow public access to shared files
CREATE POLICY "Public can view shared files" 
  ON public.file_shares FOR SELECT 
  USING (true);
