#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
FLASK_ENV=development
BIGBOX_API_KEY=52323740B6D14CBE81D81C81E0DD32E6
LOWES_API_KEY=D302834B9CC3400FA921A2F2D384ADD6
PORT=8080
EOL
  echo ".env file created with your API keys"
fi

# Load environment variables from .env file
echo "Loading environment variables..."
export $(grep -v '^#' .env | xargs)

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the application
echo "Starting application..."
python run.py
