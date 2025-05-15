# BuildSmart Supabase Setup Guide

This guide will walk you through setting up Supabase for the BuildSmart application.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account (free tier is sufficient)

## Step 1: Set Up Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project with the following details:
   - Name: BuildSmart
   - Database Password: (create a secure password)
   - Region: (choose the region closest to you)
3. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Supabase Credentials

1. Once your project is created, go to the project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" in the submenu
4. Note down the following values:
   - Project URL
   - Project API Keys (anon public and service_role)

## Step 3: Set Up Environment Variables

Create a `.env` file in the root of the project with the following content:

```
SUPABASE_URL=https://ydisdyadjupyswcpbxzu.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Replace `your_anon_key` and `your_service_role_key` with the values from Step 2.

## Step 4: Initialize the Database

Run the initialization script to create the necessary tables and policies:

```bash
# Set the service role key as an environment variable
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make the script executable
chmod +x init-supabase.js

# Run the script
node init-supabase.js
```

Alternatively, you can manually execute the SQL in the `supabase/schema.sql` file using the Supabase SQL Editor:

1. Go to the Supabase dashboard
2. Click on "SQL Editor" in the sidebar
3. Create a new query
4. Copy and paste the contents of `supabase/schema.sql`
5. Click "Run"

## Step 5: Configure Authentication

1. Go to the Supabase dashboard
2. Click on "Authentication" in the sidebar
3. Click on "Settings" in the submenu
4. Under "Email Auth", make sure "Enable Email Signup" is turned on
5. Optionally, configure additional authentication providers (Google, GitHub, etc.)

## Step 6: Set Up Storage (Optional)

If you want to use Supabase Storage for project photos:

1. Go to the Supabase dashboard
2. Click on "Storage" in the sidebar
3. Click "Create a new bucket"
4. Name the bucket "project-photos"
5. Set the bucket to private
6. Click "Create bucket"
7. Set up the following policy to allow authenticated users to upload files:
   - Go to the "Policies" tab
   - Click "Add Policy"
   - Select "Create custom policy"
   - Name: "Allow authenticated uploads"
   - Policy definition: `(auth.role() = 'authenticated')`
   - Click "Save policy"

## Step 7: Update the Frontend Configuration

Make sure the Supabase client in the frontend is configured with the correct URL and API key:

```typescript
// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydisdyadjupyswcpbxzu.supabase.co';
const supabaseAnonKey = 'your_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Step 8: Test the Integration

1. Start the frontend application:

```bash
cd frontend
npm run dev
```

2. Open the application in your browser
3. Sign up for a new account
4. Create a new project
5. Verify that the project is saved to Supabase

## Troubleshooting

### Authentication Issues

If you encounter authentication issues:

1. Check that the Supabase URL and API keys are correct
2. Make sure Email Auth is enabled in the Supabase dashboard
3. Check the browser console for any errors

### Database Issues

If you encounter database issues:

1. Check that the tables were created correctly in the Supabase dashboard
2. Verify that the RLS policies are set up correctly
3. Try running the SQL schema manually in the Supabase SQL Editor

### CORS Issues

If you encounter CORS issues:

1. Go to the Supabase dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" in the submenu
4. Add your frontend URL to the "Additional Allowed Hosts" section

## Supabase Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
