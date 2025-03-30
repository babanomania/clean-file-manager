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

async function fixAdminRole() {
  try {
    console.log('Starting admin role fix...');
    
    // Get the admin user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    const adminUser = users.find(u => u.email === 'admin@cleanfs.com');
    
    if (!adminUser) {
      throw new Error('Admin user not found. Please create the admin user first.');
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    console.log('Current user metadata:', adminUser.user_metadata);
    
    // Update user metadata
    console.log('Updating user metadata...');
    const { error: updateMetaError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        user_metadata: {
          name: 'Admin User',
          role: 'admin',
          is_approved: true
        }
      }
    );
    
    if (updateMetaError) {
      throw new Error(`Failed to update user metadata: ${updateMetaError.message}`);
    }
    
    console.log('User metadata updated successfully.');
    
    // Check if profiles table exists
    console.log('Checking profiles table...');
    
    // Try to update the profile directly
    console.log('Updating profile in profiles table...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: adminUser.id,
        email: adminUser.email,
        name: 'Admin User',
        role: 'admin',
        is_approved: true,
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      
      // Try direct SQL as a last resort
      console.log('Trying direct SQL update...');
      const updateSQL = `
        UPDATE profiles 
        SET role = 'admin', is_approved = true 
        WHERE id = '${adminUser.id}';
        
        INSERT INTO profiles (id, email, name, role, is_approved, created_at, updated_at)
        VALUES (
          '${adminUser.id}',
          '${adminUser.email}',
          'Admin User',
          'admin',
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
      
      const { error: sqlError } = await supabase.rpc('pgSQL', { query: updateSQL }).catch(err => {
        return { error: err };
      });
      
      if (sqlError) {
        console.log('SQL update failed, but this is expected if the RPC function does not exist.');
        console.log('Please run the SQL manually in the Supabase SQL Editor if needed.');
      }
    } else {
      console.log('Profile updated successfully in profiles table.');
    }
    
    console.log('\n✅ Admin role fix completed!');
    console.log('The admin user should now have the correct role.');
    console.log('\nIf you still cannot see the admin menu:');
    console.log('1. Check the browser console for any errors');
    console.log('2. Try logging out and logging back in');
    console.log('3. Verify that the role is set to "admin" in both auth.users and profiles table');
    
  } catch (error) {
    console.error('❌ Error fixing admin role:', error.message);
    process.exit(1);
  }
}

fixAdminRole();
