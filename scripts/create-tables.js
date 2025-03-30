// Script to create the necessary tables for the file manager application
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createTables() {
  console.log('Creating tables for the file manager application...')
  
  try {
    // Create files table
    console.log('Creating files table...')
    const { error: filesError } = await supabase.rpc('pg_dump', {
      query: `
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
      `
    })
    
    if (filesError) {
      console.error('Error creating files table:', filesError.message)
    } else {
      console.log('✅ Files table created successfully')
    }
    
    // Create file_shares table
    console.log('Creating file_shares table...')
    const { error: sharesError } = await supabase.rpc('pg_dump', {
      query: `
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
      `
    })
    
    if (sharesError) {
      console.error('Error creating file_shares table:', sharesError.message)
    } else {
      console.log('✅ File_shares table created successfully')
    }
    
    // Create a test file record
    console.log('Creating a test file record...')
    const { error: insertError } = await supabase
      .from('files')
      .insert({
        name: 'test-file.txt',
        type: 'text/plain',
        size: 1024,
        storage_path: 'test/test-file.txt',
        user_id: '945dab10-7b30-445b-9f18-4766cb2686f8', // Test user ID from previous script
      })
    
    if (insertError) {
      console.error('Error creating test file record:', insertError.message)
    } else {
      console.log('✅ Test file record created successfully')
    }
    
    // Verify tables were created
    console.log('\nVerifying tables were created...')
    
    const { data: files, error: filesQueryError } = await supabase
      .from('files')
      .select('*')
    
    if (filesQueryError) {
      console.error('Error querying files table:', filesQueryError.message)
    } else {
      console.log('✅ Files table exists and can be queried')
      console.log('Files:', files)
    }
    
    const { data: shares, error: sharesQueryError } = await supabase
      .from('file_shares')
      .select('*')
    
    if (sharesQueryError) {
      console.error('Error querying file_shares table:', sharesQueryError.message)
    } else {
      console.log('✅ File_shares table exists and can be queried')
      console.log('Shares:', shares)
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Run the script
createTables()
