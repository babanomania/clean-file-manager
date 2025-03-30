// Script to set up Supabase resources for the file manager application
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey)

// SQL for creating tables and policies
const setupSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'select_own_files'
  ) THEN
    CREATE POLICY select_own_files ON public.files
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for users to insert their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'insert_own_files'
  ) THEN
    CREATE POLICY insert_own_files ON public.files
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for users to update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'update_own_files'
  ) THEN
    CREATE POLICY update_own_files ON public.files
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'files' AND policyname = 'delete_own_files'
  ) THEN
    CREATE POLICY delete_own_files ON public.files
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'select_own_shares'
  ) THEN
    CREATE POLICY select_own_shares ON public.file_shares
      FOR SELECT USING (
        file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

-- Policy for users to insert their own file shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'insert_own_shares'
  ) THEN
    CREATE POLICY insert_own_shares ON public.file_shares
      FOR INSERT WITH CHECK (
        file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

-- Policy for users to update their own file shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'update_own_shares'
  ) THEN
    CREATE POLICY update_own_shares ON public.file_shares
      FOR UPDATE USING (
        file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

-- Policy for users to delete their own file shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'delete_own_shares'
  ) THEN
    CREATE POLICY delete_own_shares ON public.file_shares
      FOR DELETE USING (
        file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

-- Allow public access to shared files via share link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'file_shares' AND policyname = 'public_access_to_shares'
  ) THEN
    CREATE POLICY public_access_to_shares ON public.file_shares
      FOR SELECT USING (true);
  END IF;
END
$$;
`

// Storage bucket policy definitions
const storagePolicies = [
  // Allow users to upload files to their own folder
  {
    name: 'Upload files',
    definition: `(bucket_id = 'files' AND auth.uid() = CAST(storage.foldername(name) AS uuid))`,
    operation: 'INSERT'
  },
  // Allow users to download their own files
  {
    name: 'Download own files',
    definition: `(bucket_id = 'files' AND auth.uid() = CAST(storage.foldername(name) AS uuid))`,
    operation: 'SELECT'
  },
  // Allow users to delete their own files
  {
    name: 'Delete own files',
    definition: `(bucket_id = 'files' AND auth.uid() = CAST(storage.foldername(name) AS uuid))`,
    operation: 'DELETE'
  }
]

// Create a test user if needed
async function createTestUser() {
  const email = 'test@example.com'
  const password = 'password123'
  
  try {
    // Create new user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`Test user ${email} already exists`)
      } else {
        console.error('Error creating test user:', error.message)
      }
      return
    }
    
    console.log(`Test user created successfully: ${email}`)
  } catch (err) {
    console.error('Unexpected error creating user:', err)
  }
}

// Create storage bucket with policies
async function setupStorageBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: getBucketsError } = await supabase
      .storage
      .listBuckets()
    
    if (getBucketsError) {
      console.error('Error checking buckets:', getBucketsError.message)
      return false
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'files')
    
    if (!bucketExists) {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket('files', {
        public: false,
        fileSizeLimit: null,
        allowedMimeTypes: null
      })
      
      if (error) {
        console.error('Error creating storage bucket:', error.message)
        return false
      }
      
      console.log('Storage bucket "files" created successfully')
    } else {
      console.log('Storage bucket "files" already exists')
    }
    
    // Create storage policies using direct SQL
    for (const policy of storagePolicies) {
      try {
        const policySQL = `
          BEGIN;
          
          -- Check if policy exists
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'objects' 
              AND schemaname = 'storage' 
              AND policyname = '${policy.name}'
            ) THEN
              -- Create policy
              CREATE POLICY "${policy.name}" ON storage.objects
                FOR ${policy.operation} 
                USING (${policy.definition});
            END IF;
          END
          $$;
          
          COMMIT;
        `
        
        const { error } = await supabase.rpc('pgaudit.exec_sql', { sql: policySQL })
        
        if (error) {
          // Try alternative method
          const { error: directError } = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            },
            body: JSON.stringify({
              query: policySQL
            })
          }).then(res => res.json())
          
          if (directError) {
            console.error(`Error creating ${policy.name} policy:`, directError)
          } else {
            console.log(`Storage policy "${policy.name}" created successfully`)
          }
        } else {
          console.log(`Storage policy "${policy.name}" created successfully`)
        }
      } catch (err) {
        console.error(`Error creating ${policy.name} policy:`, err)
      }
    }
    
    return true
  } catch (err) {
    console.error('Unexpected error setting up storage bucket:', err)
    return false
  }
}

// Run SQL to create tables and policies
async function setupDatabase() {
  try {
    // Try using pgaudit.exec_sql RPC function
    const { error: rpcError } = await supabase.rpc('pgaudit.exec_sql', { sql: setupSQL })
    
    if (!rpcError) {
      console.log('Database tables and policies created successfully')
      return true
    }
    
    console.log('RPC method failed, trying direct SQL execution...')
    
    // Try direct SQL execution using fetch
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        query: setupSQL
      })
    })
    
    const result = await response.json()
    
    if (result.error) {
      console.error('Error setting up database tables:', result.error)
      return false
    }
    
    console.log('Database tables and policies created successfully')
    return true
  } catch (err) {
    console.error('Unexpected error setting up database:', err)
    return false
  }
}

// Create setup script
async function setupSupabase() {
  console.log('Setting up Supabase resources for file manager application...')
  console.log(`Using Supabase URL: ${supabaseUrl}`)
  
  try {
    // Create storage bucket and policies
    console.log('\n1. Setting up storage bucket and policies...')
    const storageSuccess = await setupStorageBucket()
    
    // Create database tables and policies
    console.log('\n2. Setting up database tables and policies...')
    const dbSuccess = await setupDatabase()
    
    // Create test user
    console.log('\n3. Setting up test user...')
    await createTestUser()
    
    console.log('\n=== Setup Summary ===')
    console.log(`Storage setup: ${storageSuccess ? 'SUCCESS' : 'FAILED'}`)
    console.log(`Database setup: ${dbSuccess ? 'SUCCESS' : 'FAILED'}`)
    
    // Create .env.local file if it doesn't exist
    const envPath = path.join(__dirname, '..', '.env.local')
    if (!fs.existsSync(envPath)) {
      const envContent = `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`
      fs.writeFileSync(envPath, envContent)
      console.log('\nCreated .env.local file with Supabase configuration')
    }
    
    console.log('\nSetup completed!')
    console.log('\nYou can now log in with:')
    console.log('Email: test@example.com')
    console.log('Password: password123')
    
  } catch (err) {
    console.error('Unexpected error during setup:', err)
  }
}

// Run the setup
setupSupabase()
