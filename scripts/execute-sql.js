// Script to execute SQL against Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSql() {
  try {
    console.log('Executing SQL to create tables...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '')
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.trim().substring(0, 50)}...`)
      
      const { error } = await supabase.rpc('exec_sql', {
        query: statement.trim()
      })
      
      if (error) {
        console.error('Error executing SQL:', error.message)
      } else {
        console.log('✅ Statement executed successfully')
      }
    }
    
    console.log('\nVerifying tables were created...')
    
    // Check if the tables exist
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    })
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError.message)
    } else {
      console.log('Tables in public schema:', tables)
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Run the script
executeSql()
