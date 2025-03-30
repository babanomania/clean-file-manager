# User Management System Setup

This directory contains SQL migrations to set up the user management system with approval workflow.

## Setting Up the Profiles Table

The `create_profiles_table.sql` file contains all the necessary SQL commands to:

1. Create the profiles table for storing user information
2. Set up Row Level Security (RLS) policies for proper access control
3. Create a trigger to automatically handle new user registrations
4. Configure admin access permissions

## How to Run the Migration

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `create_profiles_table.sql`
4. Paste into the SQL Editor and run the commands

## Creating the First Admin User

After running the migration, you'll need to create your first admin user:

1. Register a new user through the sign-up page
2. In the Supabase dashboard, go to the "Table Editor" and select the "profiles" table
3. Find your user and update the following fields:
   - `is_approved`: Set to `true`
   - `role`: Change from `user` to `admin`

## User Approval Workflow

1. New users register through the sign-up page
2. Their accounts are created with `is_approved = false`
3. Admin users can log in and access the admin panel at `/admin`
4. In the admin panel, admins can approve new users and manage user roles

## Troubleshooting

If you encounter issues with the RLS policies, make sure:

1. The policies are correctly applied to the profiles table
2. Your admin user has the `role` field set to `admin` in the profiles table
3. The trigger function `handle_new_user()` is properly created

For any database-related errors, check the Supabase logs in the dashboard.
