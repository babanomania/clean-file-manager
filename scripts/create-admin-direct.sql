-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for the profiles table (if they don't exist)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create a function to insert the admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS TEXT AS $$
DECLARE
  admin_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@cleanfs.com'
  ) INTO admin_exists;
  
  -- If admin doesn't exist, create it
  IF NOT admin_exists THEN
    -- Create user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) 
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@cleanfs.com',
      -- This is a hashed version of 'Admin123!' - you should change this after login
      crypt('Admin123!', gen_salt('bf')),
      NOW(),
      NULL,
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin User", "role": "admin", "is_approved": true}',
      NOW(),
      NOW(),
      '',
      NULL,
      '',
      ''
    )
    RETURNING id INTO admin_id;
    
    -- Add user to profiles table
    INSERT INTO profiles (
      id,
      email,
      name,
      is_approved,
      role,
      created_at,
      updated_at
    )
    VALUES (
      admin_id,
      'admin@cleanfs.com',
      'Admin User',
      TRUE,
      'admin',
      NOW(),
      NOW()
    );
    
    RETURN 'Admin user created successfully with ID: ' || admin_id;
  ELSE
    -- Get the admin user ID
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@cleanfs.com';
    
    -- Update the user metadata
    UPDATE auth.users
    SET 
      raw_user_meta_data = '{"name": "Admin User", "role": "admin", "is_approved": true}',
      updated_at = NOW()
    WHERE id = admin_id;
    
    -- Ensure user is in profiles table
    INSERT INTO profiles (
      id,
      email,
      name,
      is_approved,
      role,
      created_at,
      updated_at
    )
    VALUES (
      admin_id,
      'admin@cleanfs.com',
      'Admin User',
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
    
    RETURN 'Admin user updated successfully with ID: ' || admin_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the admin user
SELECT create_admin_user();
