#!/bin/bash

# Exit on error
set -e

echo "Initializing Home Health Score project..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please edit the .env file with your API keys and configuration."
fi

# Initialize frontend
echo "Initializing frontend..."
cd frontend

# Check if package.json exists
if [ ! -f package.json ]; then
  echo "Error: package.json not found in frontend directory."
  exit 1
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Initialize backend
echo "Initializing backend..."
cd ../backend

# Create virtual environment if it doesn't exist
if [ ! -d venv ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Create necessary directories in Supabase
echo "
Next steps:

1. Edit the .env file with your API keys and configuration
2. Create the following tables in Supabase:
   - user_profiles
   - voice_sessions
   - assessment_results
3. Create the following storage buckets in Supabase:
   - audio-uploads
   - reports
4. Start the frontend: cd frontend && npm run dev
5. Start the backend: cd backend && source venv/bin/activate && uvicorn main:app --reload

For detailed instructions, see the deployment-config.md file.
"

echo "Initialization complete!"
