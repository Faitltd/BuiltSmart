#!/bin/bash
# Setup script for deploying the Home Depot Product Data Extractor on a virtual machine

# Update system packages
apt-get update
apt-get install -y python3-pip git

# Create app directory
mkdir -p /app
cd /app

# Copy application files (update as needed based on your storage method)
# Option 1: If deployed from a GitHub repository
# git clone https://github.com/your-username/your-repo.git .

# Option 2: If files are uploaded directly to the VM
# Note: This is your responsibility to do manually

# Option 3: If files are stored in Cloud Storage
# gsutil -m cp -r gs://your-bucket/homedepot-extractor/* .

# Install dependencies
pip3 install -r requirements.txt

# Set environment variables
export BIGBOX_API_KEY="52323740B6D14CBE81D81C81E0DD32E6"
export PORT=8080

# Run the application
python3 -m gunicorn -b :8080 cloud_app:app
