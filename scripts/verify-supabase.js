// Script to verify Supabase setup and create tables if needed
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SQL for creating tables
const createFilesTableSQL = `
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own files
DROP POLICY IF EXISTS select_own_files ON public.files;
CREATE POLICY select_own_files ON public.files
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own files
DROP POLICY IF EXISTS insert_own_files ON public.files;
CREATE POLICY insert_own_files ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own files
DROP POLICY IF EXISTS update_own_files ON public.files;
CREATE POLICY update_own_files ON public.files
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own files
DROP POLICY IF EXISTS delete_own_files ON public.files;
CREATE POLICY delete_own_files ON public.files
  FOR DELETE USING (auth.uid() = user_id);
`

const createFileSharesTableSQL = `
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('temporary', 'permanent')),
  share_link TEXT NOT NULL UNIQUE,
  expiry_date TIMESTAMPTZ,
  password TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own file shares
DROP POLICY IF EXISTS select_own_shares ON public.file_shares;
CREATE POLICY select_own_shares ON public.file_shares
  FOR SELECT USING (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Policy for users to insert their own file shares
DROP POLICY IF EXISTS insert_own_shares ON public.file_shares;
CREATE POLICY insert_own_shares ON public.file_shares
  FOR INSERT WITH CHECK (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Policy for users to update their own file shares
DROP POLICY IF EXISTS update_own_shares ON public.file_shares;
CREATE POLICY update_own_shares ON public.file_shares
  FOR UPDATE USING (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Policy for users to delete their own file shares
DROP POLICY IF EXISTS delete_own_shares ON public.file_shares;
CREATE POLICY delete_own_shares ON public.file_shares
  FOR DELETE USING (
    file_id IN (SELECT id FROM public.files WHERE user_id = auth.uid())
  );

-- Allow public access to shared files via share link
DROP POLICY IF EXISTS public_access_to_shares ON public.file_shares;
CREATE POLICY public_access_to_shares ON public.file_shares
  FOR SELECT USING (true);
`

// Create a sample file record
async function createSampleFile(userId) {
  try {
    const { error } = await supabase
      .from('files')
      .insert({
        name: 'sample-file.txt',
        type: 'text/plain',
        size: 1024,
        storage_path: `${userId}/sample-file.txt`,
        user_id: userId,
      })
    
    if (error) {
      console.log('Error creating sample file:', error.message)
      return false
    }
    
    console.log('✅ Sample file record created')
    return true
  } catch (err) {
    console.error('Error creating sample file:', err)
    return false
  }
}

// Create a test user
async function createTestUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true
    })
    
    if (error) {
      console.log('Error creating test user:', error.message)
      return null
    }
    
    console.log('✅ Test user created')
    return data.user.id
  } catch (err) {
    console.error('Error creating test user:', err)
    return null
  }
}

// Create storage bucket
async function createStorageBucket() {
  try {
    const { data, error } = await supabase.storage.createBucket('files', {
      public: false
    })
    
    if (error) {
      console.log('Error creating storage bucket:', error.message)
      return false
    }
    
    console.log('✅ Storage bucket "files" created')
    return true
  } catch (err) {
    console.error('Error creating storage bucket:', err)
    return false
  }
}

async function verifySupabase() {
  console.log('Verifying Supabase setup...')
  console.log(`Using Supabase URL: ${supabaseUrl}`)
  
  try {
    // Check if storage bucket exists
    console.log('\n1. Checking storage bucket...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Error checking storage buckets:', bucketError.message)
    } else {
      const filesBucket = buckets.find(bucket => bucket.name === 'files')
      if (filesBucket) {
        console.log('✅ Storage bucket "files" exists')
        console.log(filesBucket)
      } else {
        console.log('❌ Storage bucket "files" does not exist')
        console.log('Creating storage bucket...')
        await createStorageBucket()
      }
    }
    
    // Check if files table exists and create it if needed
    console.log('\n2. Checking database tables...')
    
    // Try to query the files table to see if it exists
    const { data: filesCheck, error: filesCheckError } = await supabase
      .from('files')
      .select('count(*)', { count: 'exact', head: true })
    
    if (filesCheckError && filesCheckError.message.includes('does not exist')) {
      console.log('Files table does not exist, creating it...')
      
      // Create the files table using the SQL query
      const { error: createFilesError } = await supabase.rpc('exec_sql', {
        sql: createFilesTableSQL
      }).catch(err => {
        console.log('Error with RPC call, trying direct query...')
        return supabase.from('_exec_sql').select('*').eq('sql', createFilesTableSQL)
      })
      
      if (createFilesError) {
        console.log('Error creating files table:', createFilesError.message)
        console.log('Please create the files table manually using the SQL Editor in Supabase Studio')
      } else {
        console.log('✅ Files table created')
      }
    } else if (filesCheckError) {
      console.log('Error checking files table:', filesCheckError.message)
    } else {
      console.log('✅ Files table already exists')
    }
    
    // Try to query the file_shares table to see if it exists
    const { data: sharesCheck, error: sharesCheckError } = await supabase
      .from('file_shares')
      .select('count(*)', { count: 'exact', head: true })
    
    if (sharesCheckError && sharesCheckError.message.includes('does not exist')) {
      console.log('File_shares table does not exist, creating it...')
      
      // Create the file_shares table using the SQL query
      const { error: createSharesError } = await supabase.rpc('exec_sql', {
        sql: createFileSharesTableSQL
      }).catch(err => {
        console.log('Error with RPC call, trying direct query...')
        return supabase.from('_exec_sql').select('*').eq('sql', createFileSharesTableSQL)
      })
      
      if (createSharesError) {
        console.log('Error creating file_shares table:', createSharesError.message)
        console.log('Please create the file_shares table manually using the SQL Editor in Supabase Studio')
      } else {
        console.log('✅ File_shares table created')
      }
    } else if (sharesCheckError) {
      console.log('Error checking file_shares table:', sharesCheckError.message)
    } else {
      console.log('✅ File_shares table already exists')
    }
    
    // Check if test user exists
    console.log('\n3. Checking test user...')
    
    // List users instead of using getUserByEmail which might not be available
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.log('Error listing users:', usersError.message)
      console.log('Attempting to create a test user...')
      const userId = await createTestUser()
      if (userId) {
        console.log('\n4. Creating a sample file record...')
        await createSampleFile(userId)
      }
    } else {
      const testUser = users?.users?.find(user => user.email === 'test@example.com')
      
      if (testUser) {
        console.log('✅ Test user exists')
        console.log('User ID:', testUser.id)
        
        // Create a sample file for the test user
        console.log('\n4. Creating a sample file record...')
        await createSampleFile(testUser.id)
      } else {
        console.log('❌ Test user does not exist')
        console.log('Creating test user...')
        const userId = await createTestUser()
        if (userId) {
          console.log('\n4. Creating a sample file record...')
          await createSampleFile(userId)
        }
      }
    }
    
    // Final verification - try to query files and shares
    console.log('\n5. Final verification - querying tables...')
    
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(5)
    
    if (filesError) {
      console.log('Error querying files table:', filesError.message)
    } else {
      console.log('✅ Files table can be queried')
      console.log('Files:', files)
    }
    
    const { data: shares, error: sharesError } = await supabase
      .from('file_shares')
      .select('*')
      .limit(5)
    
    if (sharesError) {
      console.log('Error querying file_shares table:', sharesError.message)
    } else {
      console.log('✅ File_shares table can be queried')
      console.log('Shares:', shares)
    }
    
  } catch (err) {
    console.error('Unexpected error during verification:', err)
  }
}

// Run the verification
verifySupabase()
