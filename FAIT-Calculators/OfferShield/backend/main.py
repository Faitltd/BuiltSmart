from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os
import json
from dotenv import load_dotenv
import openai
from supabase import create_client, Client
import stripe
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="OfferShield API", description="API for analyzing contractor quotes")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Models
class QuoteAnalysisRequest(BaseModel):
    text: str
    job_type: Optional[str] = None
    zip_code: Optional[str] = None
    budget: Optional[float] = None

class QuoteAnalysisResponse(BaseModel):
    flagged_items: List[dict]
    clarifying_questions: List[str]
    confidence_score: int
    missing_elements: List[str]
    summary: str

# Helper functions
async def extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from a PDF file."""
    # Implementation will depend on the PDF parsing library
    # For now, return a placeholder
    return "Sample extracted text from PDF"

async def analyze_quote_with_gpt(text: str, job_type: Optional[str], zip_code: Optional[str], budget: Optional[float]) -> dict:
    """Analyze the quote text using GPT-4."""
    
    # Construct the prompt
    system_prompt = """You are a home renovation contract analyst. Your job is to detect vague or suspicious language, missing line items, markup padding, and give plain-English feedback to homeowners unfamiliar with construction terms. Be clear and concise."""
    
    user_prompt = f"""Here's a quote for a {job_type or 'home renovation'} project"""
    
    if zip_code:
        user_prompt += f" in {zip_code}"
    
    if budget:
        user_prompt += f", with a ${budget} budget"
    
    user_prompt += f""".\n\n{text}\n\nReturn:\n1. List of flagged items and why they are risky\n2. Top 3 clarifying questions the client should ask\n3. Overall confidence score (0–100)\n4. Missing common elements based on this job type\n5. 2-sentence summary"""
    
    # Call OpenAI API
    response = await openai.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=1500,
    )
    
    # Parse the response
    # This is a simplified version - in production, you'd want more robust parsing
    analysis_text = response.choices[0].message.content
    
    # For now, return a structured mock response
    return {
        "flagged_items": [
            {"item": "Labor costs", "reason": "Vague description without hourly breakdown"},
            {"item": "Materials markup", "reason": "30% markup is above industry standard of 15-20%"}
        ],
        "clarifying_questions": [
            "Can you provide an hourly breakdown of labor costs?",
            "What specific brand and model of fixtures are included?",
            "Is debris removal included in the quote?"
        ],
        "confidence_score": 75,
        "missing_elements": ["Detailed timeline", "Payment schedule", "Warranty information"],
        "summary": "This quote lacks specificity in labor costs and has above-average markups on materials. Request more details on timeline, payment terms, and specific materials before proceeding."
    }

# Routes
@app.post("/api/analyze", response_model=QuoteAnalysisResponse)
async def analyze_quote(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    job_type: Optional[str] = Form(None),
    zip_code: Optional[str] = Form(None),
    budget: Optional[float] = Form(None),
    authorization: Optional[str] = Header(None)
):
    """Analyze a contractor quote."""
    
    # Check if user is authenticated
    if authorization:
        # Verify JWT token with Supabase
        try:
            user = supabase.auth.get_user(authorization.split(" ")[1])
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    # Get the quote text
    quote_text = text
    if file and not text:
        if file.content_type == "application/pdf":
            quote_text = await extract_text_from_pdf(file)
        else:
            # Handle other file types or raise an error
            raise HTTPException(status_code=400, detail="Unsupported file type")
    
    if not quote_text:
        raise HTTPException(status_code=400, detail="No quote text provided")
    
    # Analyze the quote
    analysis = await analyze_quote_with_gpt(quote_text, job_type, zip_code, budget)
    
    return analysis

@app.post("/api/payment/create-checkout-session")
async def create_checkout_session():
    """Create a Stripe checkout session."""
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "Quote Analysis",
                        },
                        "unit_amount": 999,  # $9.99
                    },
                    "quantity": 1,
                },
            ],
            mode="payment",
            success_url=os.getenv("FRONTEND_URL") + "/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=os.getenv("FRONTEND_URL") + "/cancel",
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
