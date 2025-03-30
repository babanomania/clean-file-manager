// Script to upload a test file to Supabase storage
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a test file
const testFilePath = path.join(__dirname, 'test-file.txt')
fs.writeFileSync(testFilePath, 'This is a test file for the file manager application.')

async function uploadTestFile() {
  try {
    console.log('Uploading test file to Supabase storage...')
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError.message)
      console.log('Please make sure you are logged in. Try running:')
      console.log('npx supabase login')
      return
    }
    
    if (!user) {
      console.error('No user found. Please log in first.')
      return
    }
    
    console.log('User ID:', user.id)
    
    // Upload the file to the 'files' bucket
    const fileName = `${user.id}/test-file.txt`
    const fileContent = fs.readFileSync(testFilePath)
    
    const { data, error } = await supabase.storage
      .from('files')
      .upload(fileName, fileContent, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (error) {
      console.error('Error uploading file:', error.message)
    } else {
      console.log('✅ File uploaded successfully!')
      console.log('File path:', data.path)
      
      // Get a public URL for the file
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(data.path)
      
      console.log('Public URL:', urlData.publicUrl)
    }
    
    // Clean up
    fs.unlinkSync(testFilePath)
    console.log('Test file cleaned up')
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Run the script
uploadTestFile()
