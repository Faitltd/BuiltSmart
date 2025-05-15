# OfferShield - Contractor Quote Risk Scanner

OfferShield is a web application that helps homeowners and buyers analyze contractor quotes for potential risks, hidden costs, vague language, and missing items. The application uses AI to provide insights and suggestions to help users make informed decisions.

## Features

- **Quote Upload**: Upload contractor quotes in PDF, DOCX, or TXT format
- **AI Analysis**: Analyze quotes using GPT-4 to detect vague language, hidden costs, and missing items
- **Risk Flags**: Identify potential issues in the quote with severity ratings
- **Clarifying Questions**: Get suggested questions to ask your contractor
- **Missing Elements**: Discover common items that might be missing from your quote
- **Confidence Score**: Understand how confident the AI is in its analysis
- **PDF Export**: Download a detailed report of the analysis

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS, React Dropzone
- **Backend**: FastAPI (Python)
- **AI**: OpenAI GPT-4 Turbo
- **Authentication**: Supabase
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Deployment**: Vercel (frontend), Fly.io (backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- OpenAI API key
- Stripe account (for payments)

### Frontend Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file and update with your values:

```bash
cp .env.local.example .env.local
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

5. Start the backend server:

```bash
uvicorn main:app --reload
```

6. The API will be available at [http://localhost:8000](http://localhost:8000)

## Deployment

### Frontend Deployment (Vercel)

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Backend Deployment (Fly.io)

1. Install the Fly CLI
2. Authenticate with Fly
3. Create a new app and deploy:

```bash
fly launch
fly secrets set OPENAI_API_KEY=your_api_key
fly secrets set SUPABASE_URL=your_supabase_url
fly secrets set SUPABASE_KEY=your_supabase_key
fly secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
fly secrets set FRONTEND_URL=your_frontend_url
fly deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
