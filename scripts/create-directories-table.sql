-- Create directories table
CREATE TABLE IF NOT EXISTS directories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  user_id UUID NOT NULL,
  parent_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for directories
ALTER TABLE directories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own directories
CREATE POLICY select_own_directories ON directories
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own directories
CREATE POLICY insert_own_directories ON directories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own directories
CREATE POLICY update_own_directories ON directories
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own directories
CREATE POLICY delete_own_directories ON directories
  FOR DELETE USING (auth.uid() = user_id);
