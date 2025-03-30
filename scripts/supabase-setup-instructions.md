# Supabase Setup Instructions

Since we're having issues with the Supabase CLI and programmatic table creation, here's how to set up the necessary tables manually using the Supabase Studio UI:

## Step 1: Access Supabase Studio

Open your browser and navigate to:
- Local development: http://localhost:54323
- Remote Supabase project: https://app.supabase.io/project/[your-project-id]

## Step 2: Create Storage Bucket

1. Go to the "Storage" section in the left sidebar
2. Click "Create Bucket"
3. Name the bucket "files"
4. Uncheck "Public bucket" to keep it private
5. Click "Create bucket"

## Step 3: Create Database Tables

1. Go to the "SQL Editor" section in the left sidebar
2. Create a new query
3. Copy and paste the following SQL:

```sql
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
```

4. Click "Run" to execute the SQL

## Step 4: Create a Test User

1. Go to the "Authentication" section in the left sidebar
2. Click "Users" tab
3. Click "Invite user"
4. Enter email: test@example.com
5. Click "Invite"
6. Set a password for the user

## Step 5: Verify Setup

1. Go to the "Table Editor" section in the left sidebar
2. You should see the "files" and "file_shares" tables
3. Go to the "Storage" section
4. You should see the "files" bucket

## Alternative: Use the API

If you prefer to use the API to create the tables, you can use the following code:

```javascript
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Read the SQL file and execute it
const fs = require('fs')
const sql = fs.readFileSync('./scripts/create-tables.sql', 'utf8')

// Execute the SQL using the REST API
fetch(`${supabaseUrl}/rest/v1/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  },
  body: JSON.stringify({
    query: sql
  })
}).then(response => response.json())
  .then(data => console.log('Tables created:', data))
  .catch(error => console.error('Error creating tables:', error))
```

Note: This approach may not work with all Supabase instances, as it depends on the configuration of the REST API.
