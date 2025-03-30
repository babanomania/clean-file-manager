require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if credentials are available
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase credentials not found in environment variables.');
  console.error('Please ensure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample admin user details
const ADMIN_USER = {
  email: 'admin@cleanfs.com',
  password: 'Admin123!',
  name: 'Admin User'
};

async function createAdminUser() {
  try {
    console.log('Starting admin user creation process...');
    console.log(`Email: ${ADMIN_USER.email}`);
    
    // Step 1: Create the profiles table using raw SQL
    console.log('Step 1: Creating profiles table if it does not exist...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        email TEXT NOT NULL,
        name TEXT,
        is_approved BOOLEAN DEFAULT FALSE,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: tableError } = await supabase.rpc('pgSQL', { query: createTableSQL }).catch(err => {
      return { error: err };
    });
    
    if (tableError) {
      console.log('Could not create table using RPC. This is normal if the function does not exist.');
      console.log('Continuing with user creation...');
    } else {
      console.log('Profiles table created or already exists.');
    }
    
    // Step 2: Create or get the admin user
    console.log('Step 2: Creating or getting admin user...');
    
    // Try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_USER.name,
        role: 'admin',
        is_approved: true
      }
    });
    
    let userId;
    
    if (signUpError) {
      if (signUpError.message.includes('already been registered')) {
        console.log('Admin user already exists. Getting user ID...');
        
        // Get the user ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          throw new Error(`Failed to list users: ${listError.message}`);
        }
        
        const existingUser = users.find(u => u.email === ADMIN_USER.email);
        
        if (!existingUser) {
          throw new Error('User exists but could not be found in the users list.');
        }
        
        userId = existingUser.id;
        console.log(`Found existing user with ID: ${userId}`);
        
        // Update user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              name: ADMIN_USER.name,
              role: 'admin',
              is_approved: true
            }
          }
        );
        
        if (updateError) {
          console.log(`Warning: Could not update user metadata: ${updateError.message}`);
        } else {
          console.log('Updated user metadata to admin role.');
        }
      } else {
        throw new Error(`Failed to create user: ${signUpError.message}`);
      }
    } else {
      userId = signUpData.user.id;
      console.log(`Created new user with ID: ${userId}`);
    }
    
    // Step 3: Try to insert into profiles table directly
    console.log('Step 3: Attempting to create profile record...');
    
    // First, try to create the profile record using direct SQL
    const insertProfileSQL = `
      INSERT INTO profiles (id, email, name, is_approved, role, created_at, updated_at)
      VALUES (
        '${userId}',
        '${ADMIN_USER.email}',
        '${ADMIN_USER.name}',
        TRUE,
        'admin',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) 
      DO UPDATE SET
        role = 'admin',
        is_approved = TRUE,
        updated_at = NOW();
    `;
    
    const { error: insertError } = await supabase.rpc('pgSQL', { query: insertProfileSQL }).catch(err => {
      return { error: err };
    });
    
    if (insertError) {
      console.log(`Note: Could not insert profile using SQL RPC: ${insertError.message}`);
      console.log('This is normal if the RPC function does not exist.');
      
      // Try using the standard API as a fallback
      console.log('Trying standard API to upsert profile...');
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: ADMIN_USER.email,
          name: ADMIN_USER.name,
          role: 'admin',
          is_approved: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (upsertError) {
        console.log(`Warning: Could not upsert profile: ${upsertError.message}`);
        console.log('This is expected if the profiles table does not exist yet.');
        console.log('You will need to create the profiles table manually using the SQL script.');
      } else {
        console.log('Successfully created/updated profile record.');
      }
    } else {
      console.log('Successfully created/updated profile record using SQL.');
    }
    
    console.log('\n✅ Admin user process completed!');
    console.log(`User ID: ${userId}`);
    console.log('\nYou can now log in with these credentials:');
    console.log(`Email: ${ADMIN_USER.email}`);
    console.log(`Password: ${ADMIN_USER.password}`);
    console.log('\nIMPORTANT:');
    console.log('1. Change this password immediately after first login!');
    console.log('2. If the profiles table creation failed, you will need to run the SQL script manually.');
    console.log('   See scripts/create-admin-direct.sql for the full SQL script.');
    
  } catch (error) {
    console.error('❌ Error in admin user creation process:', error.message);
    console.log('\nPlease try the following:');
    console.log('1. Run the SQL script directly in the Supabase SQL Editor');
    console.log('   See scripts/create-admin-direct.sql for the full SQL script.');
    console.log('2. Check that your SUPABASE_SERVICE_ROLE_KEY has sufficient permissions');
    process.exit(1);
  }
}

createAdminUser();
