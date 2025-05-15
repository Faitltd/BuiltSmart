# Home Health Score - Deployment Configuration

## Project Overview

Home Health Score is a voice-based application that allows users to assess their home's condition through a natural conversation with an AI assistant. The application transcribes user voice input, processes it using GPT-4, and generates a health score and repair recommendations.

## Architecture

The application follows a modern cloud-native architecture:

- **Frontend**: Next.js hosted on Vercel
- **Backend API**: FastAPI (Python) hosted on Google Cloud Run
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Services**: OpenAI (Whisper for transcription, GPT-4 for analysis)
- **Voice Output** (optional): ElevenLabs
- **Payment Processing** (optional): Stripe

## Infrastructure Setup

### 1. Supabase Setup

1. Create a new Supabase project at [https://app.supabase.io/](https://app.supabase.io/)
2. Set up the following tables:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  full_name TEXT,
  address TEXT,
  phone TEXT,
  free_assessment_used BOOLEAN DEFAULT false
);

-- Voice sessions table
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  audio_url TEXT,
  transcript TEXT,
  status TEXT DEFAULT 'pending' -- pending, processing, completed, failed
);

-- Assessment results table
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.voice_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  health_score INTEGER,
  summary TEXT,
  repairs JSONB,
  report_url TEXT
);
```

3. Set up storage buckets:
   - `audio-uploads`: For storing user voice recordings
   - `reports`: For storing generated PDF reports

4. Configure Row Level Security (RLS) policies:

```sql
-- User profiles RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Voice sessions RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON public.voice_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.voice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assessment results RLS
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own results" ON public.assessment_results
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.voice_sessions WHERE id = session_id
    )
  );
```

5. Save your Supabase URL and anon key for later use in environment variables.

### 2. OpenAI API Setup

1. Create an account at [https://platform.openai.com/](https://platform.openai.com/)
2. Generate an API key
3. Save the API key for later use in environment variables

### 3. ElevenLabs Setup (Optional)

1. Create an account at [https://elevenlabs.io/](https://elevenlabs.io/)
2. Generate an API key
3. Create a voice profile or select an existing one
4. Save the API key and voice ID for later use

### 4. Stripe Setup (Optional)

1. Create an account at [https://stripe.com/](https://stripe.com/)
2. Set up a product for "Additional Home Health Assessments" with a price of $5
3. Save the Stripe publishable key and secret key for later use

## Frontend Deployment (Vercel)

### Project Setup

1. Initialize a Next.js project:

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint
cd frontend
```

2. Install necessary dependencies:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs react-audio-voice-recorder chart.js react-chartjs-2 jspdf html2canvas
```

3. Create a `.env.local` file with the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=your_backend_api_url
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key (optional)
```

### Vercel Deployment

1. Create a `vercel.json` file in the root of the frontend directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "environment": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "NEXT_PUBLIC_API_URL": "@next_public_api_url",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@next_public_stripe_publishable_key"
  }
}
```

2. Deploy to Vercel:

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

3. Set up environment variables in the Vercel dashboard.

## Backend Deployment (Google Cloud Run)

### Project Setup

1. Create a new directory for the backend:

```bash
mkdir backend
cd backend
```

2. Create a virtual environment and install dependencies:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn openai python-multipart pydantic python-dotenv supabase stripe elevenlabs
```

3. Create a `requirements.txt` file:

```bash
pip freeze > requirements.txt
```

4. Create a `.env` file with the following environment variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key (optional)
```

5. Create a `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Google Cloud Run Deployment

1. Build and deploy to Google Cloud Run:

```bash
# Install Google Cloud SDK if not already installed
# https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project your-project-id

# Build and deploy
gcloud builds submit --tag gcr.io/your-project-id/home-health-api
gcloud run deploy home-health-api --image gcr.io/your-project-id/home-health-api --platform managed --region us-central1 --allow-unauthenticated
```

2. Set up environment variables in the Google Cloud Run console or using the command line:

```bash
gcloud run services update home-health-api --set-env-vars SUPABASE_URL=your_supabase_url,SUPABASE_SERVICE_KEY=your_supabase_service_key,OPENAI_API_KEY=your_openai_api_key
```

## CI/CD Setup

### GitHub Actions for Frontend

Create a `.github/workflows/frontend-deploy.yml` file in your repository:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
```

### GitHub Actions for Backend

Create a `.github/workflows/backend-deploy.yml` file in your repository:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v0
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true

      - name: Build and Deploy to Cloud Run
        run: |
          cd backend
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/home-health-api
          gcloud run deploy home-health-api --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/home-health-api --platform managed --region us-central1 --allow-unauthenticated
```

## Monitoring and Logging

### Frontend Monitoring

1. Set up Vercel Analytics in your Next.js project:

```bash
cd frontend
npm install @vercel/analytics
```

2. Add the analytics component to your `_app.tsx` or `_app.js` file:

```jsx
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

export default MyApp;
```

### Backend Monitoring

1. Set up Google Cloud Monitoring for your Cloud Run service:

```bash
gcloud services enable monitoring.googleapis.com
gcloud services enable cloudtrace.googleapis.com
```

2. Create custom dashboards in Google Cloud Console for:
   - API request volume
   - Error rates
   - Latency
   - OpenAI API usage

3. Set up alerts for:
   - Error rate exceeding 1%
   - P95 latency exceeding 2 seconds
   - OpenAI API quota approaching limit

## Cost Estimation

### Monthly Costs (Estimated)

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| Vercel (Frontend) | Hobby Plan | $0 (Free) |
| Google Cloud Run (Backend) | 100,000 requests/month | $5-10 |
| Supabase | Free Plan | $0 (Free) |
| OpenAI API | 1,000 transcriptions + 1,000 GPT-4 calls | $50-100 |
| ElevenLabs (Optional) | 1,000 voice generations | $20-30 |
| Total | | $75-140 |

### Scaling Considerations

As usage grows:
1. Upgrade Supabase to Pro plan ($25/month) after exceeding free tier limits
2. Consider reserved instances for Cloud Run if usage becomes predictable
3. Implement caching strategies to reduce OpenAI API calls
4. Set up budget alerts in Google Cloud to monitor spending

## Security Considerations

1. **API Security**:
   - Implement rate limiting on all API endpoints
   - Use CORS to restrict API access to your frontend domain
   - Set up API keys for backend-to-backend communication

2. **Data Security**:
   - Encrypt sensitive data at rest in Supabase
   - Implement proper authentication and authorization
   - Set up regular database backups

3. **Compliance**:
   - Add privacy policy and terms of service pages
   - Implement GDPR compliance features (data deletion, export)
   - Consider HIPAA compliance if storing health-related information

## Disaster Recovery

1. Set up regular database backups in Supabase
2. Create a recovery plan document
3. Test recovery procedures quarterly
4. Document incident response procedures
