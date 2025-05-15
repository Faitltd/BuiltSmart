# Home Health Score

A voice-based application that allows users to assess their home's condition through a natural conversation with an AI assistant.

## Features

- Voice recording and processing
- Natural language conversation about home condition
- AI-powered analysis using GPT-4
- Health score calculation (1-100)
- Prioritized repair recommendations
- Downloadable PDF reports

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Services**: OpenAI (Whisper for transcription, GPT-4 for analysis)
- **Voice Output** (optional): ElevenLabs
- **Payment Processing** (optional): Stripe

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker and Docker Compose (optional)
- Supabase account
- OpenAI API key
- ElevenLabs API key (optional)
- Stripe account (optional)

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/yourusername/home-health-score.git
cd home-health-score
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. Option 1: Run with Docker Compose:

```bash
docker-compose up
```

4. Option 2: Run frontend and backend separately:

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

5. Open your browser and navigate to http://localhost:3000

## Deployment

See the [deployment-config.md](deployment-config.md) file for detailed deployment instructions.

### Quick Deployment Steps

1. Frontend (Vercel):

```bash
cd frontend
vercel
```

2. Backend (Google Cloud Run):

```bash
cd backend
gcloud builds submit --tag gcr.io/your-project-id/home-health-api
gcloud run deploy home-health-api --image gcr.io/your-project-id/home-health-api --platform managed --region us-central1 --allow-unauthenticated
```

## Project Structure

```
home-health-score/
├── frontend/                # Next.js frontend application
│   ├── components/          # React components
│   ├── pages/               # Next.js pages
│   ├── public/              # Static assets
│   ├── styles/              # CSS styles
│   ├── Dockerfile           # Frontend Docker configuration
│   └── package.json         # Frontend dependencies
├── backend/                 # FastAPI backend application
│   ├── main.py              # Main API entry point
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── .env.example             # Example environment variables
├── deployment-config.md     # Detailed deployment instructions
└── README.md                # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for GPT-4 and Whisper APIs
- Supabase for database and authentication
- Vercel for frontend hosting
- Google Cloud for backend hosting
