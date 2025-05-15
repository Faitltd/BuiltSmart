#!/bin/bash

# BuildSmart Supabase Setup Script

echo "Setting up Supabase for BuildSmart..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Initialize Supabase project
echo "Initializing Supabase project..."
supabase init

# Set Supabase project URL and key
echo "Setting Supabase project URL and key..."
supabase link --project-ref ydisdyadjupyswcpbxzu

# Run SQL schema
echo "Running SQL schema..."
supabase db push

echo "Supabase setup complete!"
echo "You can now run the application with 'npm run dev' in the frontend directory."
