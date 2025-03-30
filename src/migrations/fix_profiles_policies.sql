-- Fix RLS policies for profiles table to avoid infinite recursion

-- First, drop all existing policies on the profiles table
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a policy for users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create a policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create a policy for admins to read all profiles
-- This avoids the recursion by using a direct check of the user's metadata
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT (auth.jwt() ->> 'role')::text = 'admin' OR
     (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  );

-- Create a policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    (SELECT (auth.jwt() ->> 'role')::text = 'admin' OR
     (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  );

-- Create a policy for admins to insert profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'role')::text = 'admin' OR
     (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin')
  );

-- Create a policy to allow service role to access all profiles
CREATE POLICY "Service role has full access"
  ON profiles
  USING (auth.role() = 'service_role');

-- Create a policy to allow authenticated users to see all profiles
-- This is useful for the admin page to list all users
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
