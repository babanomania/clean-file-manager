// Script to create a test user in Supabase
const { createClient } = require('@supabase/supabase-js')

// Use the same URL and key from your .env.local file
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// User details
const email = 'test@example.com'
const password = 'password123'

async function createUser() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      console.error('Error creating user:', error.message)
      return
    }
    
    console.log('User created successfully:', data)
    console.log('\nYou can now log in with:')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createUser()
