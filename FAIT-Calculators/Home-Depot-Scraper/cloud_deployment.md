# Deploying to Google Cloud

This guide provides instructions for deploying the Home Depot Product Data Extractor to various Google Cloud services.

## Prerequisites

1. [Create a Google Cloud account](https://cloud.google.com/free) if you don't have one
2. [Install the Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. Initialize the SDK and log in:
   ```
   gcloud init
   ```

## Option 1: Deploy to Cloud Run (Recommended)

Cloud Run is a fully managed platform that automatically scales stateless containers. This is the simplest deployment option.

1. **Build and deploy using a single command**:

   ```bash
   gcloud run deploy homedepot-data-extractor \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Set environment variables** (if you have a different API key):

   ```bash
   gcloud run services update homedepot-data-extractor \
     --set-env-vars BIGBOX_API_KEY=your_api_key_here
   ```

3. **Access your application**:
   The URL will be provided in the command output.

## Option 2: Deploy to App Engine

App Engine is a platform-as-a-service that abstracts away infrastructure management.

1. **Create an app.yaml file**:

   ```yaml
   runtime: python39
   entrypoint: gunicorn -b :$PORT cloud_app:app

   env_variables:
     BIGBOX_API_KEY: "52323740B6D14CBE81D81C81E0DD32E6"
   ```

2. **Deploy to App Engine**:

   ```bash
   gcloud app deploy
   ```

3. **Access your application**:

   ```bash
   gcloud app browse
   ```

## Option 3: Deploy to Compute Engine

For more control over the infrastructure, you can deploy to a Compute Engine VM.

1. **Create a VM instance**:

   ```bash
   gcloud compute instances create homedepot-data-extractor \
     --image-family=debian-11 \
     --image-project=debian-cloud \
     --machine-type=e2-micro \
     --tags=http-server \
     --metadata-from-file=startup-script=setup.sh
   ```

2. **Create a startup script** (setup.sh):

   ```bash
   #!/bin/bash
   apt-get update
   apt-get install -y python3-pip git

   # Clone the repository (if using GitHub)
   # git clone https://github.com/your-username/your-repo.git
   # cd your-repo

   # Or copy files using gsutil if stored in Cloud Storage
   # mkdir -p /app
   # gsutil -m cp -r gs://your-bucket/app/* /app/
   # cd /app

   # Install dependencies
   pip3 install -r requirements.txt

   # Run the application
   export BIGBOX_API_KEY="52323740B6D14CBE81D81C81E0DD32E6"
   export PORT=8080
   python3 -m gunicorn -b :8080 cloud_app:app
   ```

3. **Create a firewall rule to allow HTTP traffic**:

   ```bash
   gcloud compute firewall-rules create allow-http \
     --allow tcp:8080 \
     --target-tags http-server \
     --description "Allow HTTP traffic"
   ```

## Option 4: Deploy as a Cloud Function

For a simple API endpoint (limited functionality), you can use Cloud Functions.

1. **Create a main.py file**:

   ```python
   import functions_framework
   from flask import jsonify

   # Import the product extractor functions
   from bigbox_product_fetcher import BigBoxClient

   # Initialize the client
   client = BigBoxClient(api_key="52323740B6D14CBE81D81C81E0DD32E6")

   @functions_framework.http
   def get_product(request):
       """HTTP Cloud Function that extracts product data from Home Depot."""
       # Set CORS headers for preflight requests
       if request.method == 'OPTIONS':
           headers = {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Methods': 'GET',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Max-Age': '3600'
           }
           return ('', 204, headers)

       # Set CORS headers for the main request
       headers = {'Access-Control-Allow-Origin': '*'}

       # Get the URL or ID from the request
       url = request.args.get('url')
       product_id = request.args.get('id')

       if url:
           result = client.get_product_by_url(url)
       elif product_id:
           result = client.get_product_by_id(product_id)
       else:
           return (jsonify({'error': 'No URL or product ID provided'}), 400, headers)

       return (jsonify(result), 200, headers)
   ```

2. **Create a requirements.txt file specifically for the function**:

   ```
   functions-framework==3.0.0
   requests==2.25.0
   ```

3. **Deploy the function**:

   ```bash
   gcloud functions deploy get_product \
     --runtime python39 \
     --trigger-http \
     --allow-unauthenticated
   ```

## Continuous Deployment with Cloud Build

You can set up continuous deployment with Cloud Build:

1. **Create a cloudbuild.yaml file**:

   ```yaml
   steps:
   # Build the container image
   - name: 'gcr.io/cloud-builders/docker'
     args: ['build', '-t', 'gcr.io/$PROJECT_ID/homedepot-data-extractor', '.']
   # Push the container image to Container Registry
   - name: 'gcr.io/cloud-builders/docker'
     args: ['push', 'gcr.io/$PROJECT_ID/homedepot-data-extractor']
   # Deploy container image to Cloud Run
   - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
     entrypoint: gcloud
     args:
     - 'run'
     - 'deploy'
     - 'homedepot-data-extractor'
     - '--image'
     - 'gcr.io/$PROJECT_ID/homedepot-data-extractor'
     - '--region'
     - 'us-central1'
     - '--platform'
     - 'managed'
     - '--allow-unauthenticated'
   images:
   - 'gcr.io/$PROJECT_ID/homedepot-data-extractor'
   ```

2. **Set up a trigger in Cloud Build** to automatically deploy on code changes (if using GitHub or Cloud Source Repositories).

## Cost-Saving Tips

- Cloud Run: You only pay when your service is processing requests
- App Engine: The free tier includes 28 instance hours per day
- Cloud Functions: The free tier includes 2 million invocations per month
- Compute Engine: Use preemptible or spot VMs for significant cost savings

Remember to clean up resources when you're done to avoid unnecessary charges!
