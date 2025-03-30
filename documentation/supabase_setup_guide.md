# Supabase Setup Guide for File Manager Application

This guide will help you set up the necessary Supabase resources for the file manager application.

## Prerequisites
- Supabase local development environment running on port 54321
- Test user created with email: `test@example.com` and password: `password123`

## Setup Steps

### 1. Access Supabase Studio

Open your browser and navigate to [http://localhost:54321](http://localhost:54321).

Login with the default credentials:
- Email: `supabase`
- Password: `postgres`

### 2. Create Storage Bucket

1. In the Supabase Studio sidebar, click on "Storage"
2. Click "Create Bucket"
3. Enter the following details:
   - Name: `files`
   - Public bucket: Unchecked (private)
4. Click "Create Bucket"

### 3. Set Up Storage Bucket Policies

1. Click on the newly created "files" bucket
2. Go to the "Policies" tab
3. Create the following policies:

#### Insert Policy (Upload Files)
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Policy definition: `(auth.uid() = user_id)`

#### Select Policy (Download Files)
- Policy name: `Allow users to view their own files`
- Allowed operation: `SELECT`
- Policy definition: `(auth.uid() = owner)`

#### Delete Policy (Delete Files)
- Policy name: `Allow users to delete their own files`
- Allowed operation: `DELETE`
- Policy definition: `(auth.uid() = owner)`

### 4. Create Database Tables

1. In the Supabase Studio sidebar, click on "SQL Editor"
2. Create a new query and paste the following SQL:

```sql
-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RLS policies for files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own files
CREATE POLICY select_own_files ON public.files
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own files
CREATE POLICY insert_own_files ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own files
CREATE POLICY update_own_files ON public.files
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own files
CREATE POLICY delete_own_files ON public.files
  FOR DELETE USING (auth.uid() = user_id);

-- Create file_shares table
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('temporary', 'permanent')),
  share_link TEXT NOT NULL UNIQUE,
  expiry_date TIMESTAMPTZ,
  password TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RLS policies for file_shares table
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own file shares
CREATE POLICY select_own_shares ON public.file_shares
  FOR SELECT USING (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Policy for users to insert their own file shares
CREATE POLICY insert_own_shares ON public.file_shares
  FOR INSERT WITH CHECK (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Policy for users to update their own file shares
CREATE POLICY update_own_shares ON public.file_shares
  FOR UPDATE USING (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Policy for users to delete their own file shares
CREATE POLICY delete_own_shares ON public.file_shares
  FOR DELETE USING (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Allow public access to shared files
CREATE POLICY public_access_to_shares ON public.file_shares
  FOR SELECT USING (true);
```

3. Click "Run" to execute the SQL and create the tables

### 5. Verify Setup

After completing the setup, you can verify that everything is working correctly:

1. Log in to the file manager application with:
   - Email: `test@example.com`
   - Password: `password123`
2. Try uploading a file
3. Verify that the file appears in the file list
4. Try downloading and deleting the file to ensure all operations work correctly

## Troubleshooting

If you encounter any issues:

1. Check that the Supabase service is running correctly
2. Verify that the tables were created successfully in the Database section of Supabase Studio
3. Check that the storage bucket was created and has the correct policies
4. Look for any errors in the browser console or server logs
