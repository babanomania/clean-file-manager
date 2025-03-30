require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const SAMPLE_ADMIN = {
  email: 'admin@cleanfs.com',
  password: 'Admin123!',
  name: 'Admin User'
};

async function ensureProfilesTableExists() {
  try {
    console.log('Checking if profiles table exists...');
    
    // Try to query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    // If there's an error, the table might not exist
    if (error && error.code === '42P01') { // PostgreSQL code for undefined_table
      console.log('Profiles table does not exist. Creating it...');
      
      // Read the SQL migration file
      const sqlPath = path.join(__dirname, '..', 'src', 'migrations', 'create_profiles_table.sql');
      let sql;
      
      try {
        sql = fs.readFileSync(sqlPath, 'utf8');
      } catch (readError) {
        console.error('Could not read migration file:', readError.message);
        console.log('Creating profiles table with basic structure...');
        
        // Basic SQL to create the profiles table
        sql = `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            email TEXT NOT NULL,
            name TEXT,
            is_approved BOOLEAN DEFAULT FALSE,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create RLS policies for the profiles table
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
          
          -- Policy for users to read their own profile
          CREATE POLICY "Users can read their own profile"
            ON profiles FOR SELECT
            USING (auth.uid() = id);
          
          -- Policy for users to update their own profile
          CREATE POLICY "Users can update their own profile"
            ON profiles FOR UPDATE
            USING (auth.uid() = id);
        `;
      }
      
      // Execute the SQL to create the table
      const { error: createError } = await supabase.rpc('exec_sql', { sql });
      
      if (createError) {
        console.error('Error creating profiles table:', createError.message);
        console.log('Trying alternative method to create table...');
        
        // Try a simpler approach without RLS policies
        const simpleSql = `
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
        
        const { error: simpleCreateError } = await supabase.rpc('exec_sql', { sql: simpleSql });
        
        if (simpleCreateError) {
          throw new Error(`Failed to create profiles table: ${simpleCreateError.message}`);
        }
        
        console.log('Created profiles table with basic structure (without RLS policies).');
        console.log('Warning: You should manually apply RLS policies for security.');
      } else {
        console.log('Profiles table created successfully with RLS policies.');
      }
    } else if (error) {
      throw new Error(`Error checking profiles table: ${error.message}`);
    } else {
      console.log('Profiles table already exists.');
    }
  } catch (error) {
    console.error('Error ensuring profiles table exists:', error.message);
    console.log('Proceeding anyway...');
  }
}

async function createSampleAdmin() {
  try {
    console.log('Creating sample admin user...');
    console.log(`Email: ${SAMPLE_ADMIN.email}`);
    console.log(`Password: ${SAMPLE_ADMIN.password}`);
    
    // Ensure profiles table exists
    await ensureProfilesTableExists();

    // Create new user in auth.users
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: SAMPLE_ADMIN.email,
      password: SAMPLE_ADMIN.password,
      email_confirm: true,
      user_metadata: {
        name: SAMPLE_ADMIN.name,
        role: 'admin',
        is_approved: true
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('has already been registered')) {
        console.log(`Sample admin user already exists. Trying to update to ensure admin role...`);
        
        // Get the user ID from auth
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          throw new Error(`Failed to list users: ${userError.message}`);
        }
        
        const existingUser = userData.users.find(u => u.email === SAMPLE_ADMIN.email);
        
        if (!existingUser) {
          throw new Error(`User exists but could not be found in the users list.`);
        }
        
        // Update user metadata
        const { error: updateMetaError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              name: SAMPLE_ADMIN.name,
              role: 'admin',
              is_approved: true
            }
          }
        );
        
        if (updateMetaError) {
          throw new Error(`Failed to update user metadata: ${updateMetaError.message}`);
        }
        
        // Check if user exists in profiles table
        const { data: profileData, error: profileFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', existingUser.id)
          .single();
        
        if (profileFetchError && !profileFetchError.message.includes('No rows found')) {
          throw new Error(`Failed to check profile: ${profileFetchError.message}`);
        }
        
        // Insert or update profile
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email: SAMPLE_ADMIN.email,
            name: SAMPLE_ADMIN.name,
            role: 'admin',
            is_approved: true,
            updated_at: new Date().toISOString()
          });
        
        if (upsertError) {
          console.error('Error upserting profile:', upsertError);
          
          // Try direct insert as a fallback
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: existingUser.id,
              email: SAMPLE_ADMIN.email,
              name: SAMPLE_ADMIN.name,
              role: 'admin',
              is_approved: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError && !insertError.message.includes('duplicate key')) {
            throw new Error(`Failed to update profile: ${insertError.message}`);
          }
        }
        
        console.log(`✅ Sample admin user has been updated successfully!`);
        console.log(`User ID: ${existingUser.id}`);
        console.log('\nYou can now log in with these credentials:');
        console.log(`Email: ${SAMPLE_ADMIN.email}`);
        console.log(`Password: ${SAMPLE_ADMIN.password}`);
        console.log('\nIMPORTANT: Change this password immediately after first login!');
        return;
      } else {
        throw new Error(`Failed to create user: ${signUpError.message}`);
      }
    }

    console.log(`User created in auth.users with ID: ${authData.user.id}`);

    // Insert into profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: SAMPLE_ADMIN.email,
        name: SAMPLE_ADMIN.name,
        role: 'admin',
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error inserting into profiles:', profileError);
      
      // Try upsert instead
      console.log('Trying upsert instead of insert...');
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: SAMPLE_ADMIN.email,
          name: SAMPLE_ADMIN.name,
          role: 'admin',
          is_approved: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (upsertError) {
        throw new Error(`Failed to create profile: ${upsertError.message}`);
      }
    }

    console.log(`✅ Sample admin user created successfully!`);
    console.log(`User ID: ${authData.user.id}`);
    console.log('\nYou can now log in with these credentials:');
    console.log(`Email: ${SAMPLE_ADMIN.email}`);
    console.log(`Password: ${SAMPLE_ADMIN.password}`);
    console.log('\nIMPORTANT: Change this password immediately after first login!');
    
  } catch (error) {
    console.error('❌ Error creating sample admin user:', error.message);
    process.exit(1);
  }
}

createSampleAdmin();
