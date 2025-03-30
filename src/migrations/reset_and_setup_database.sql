-- Reset and setup database for CleanFS
-- Run this script in the Supabase SQL Editor to reset and set up your database

-- Drop existing tables if they exist
DROP TABLE IF EXISTS profiles;

-- Create profiles table
CREATE TABLE profiles (
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

-- Create policies
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

-- Create trigger function for new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, is_approved, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', false, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a simple admin user
-- This will create a user with email: admin@cleanfs.com and password: Admin123!
DO $$
DECLARE
  admin_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@cleanfs.com'
  ) INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Create admin user
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
    
    RAISE NOTICE 'Admin user created with ID: %', admin_id;
  ELSE
    -- Get existing admin user ID
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
    
    RAISE NOTICE 'Admin user updated with ID: %', admin_id;
  END IF;
END $$;
