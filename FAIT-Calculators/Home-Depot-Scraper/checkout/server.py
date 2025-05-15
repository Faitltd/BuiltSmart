#!/usr/bin/env python3
"""
Checkout Server for Scraper Service

This module provides a simple server for the checkout pages and Stripe integration.
"""

import os
import sys
import json
import logging
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import stripe
from dotenv import load_dotenv

# Add parent directory to path to import db module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import FirestoreDB

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure Stripe
stripe_api_key = os.getenv('STRIPE_MASTER_API_KEY')
stripe_publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY')
stripe.api_key = stripe_api_key

# Configure Firestore
project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'fait-444705')

# Create FastAPI app
app = FastAPI(title="Scraper Checkout Service",
              description="Checkout service for purchasing scraper credits")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure templates
templates = Jinja2Templates(directory="checkout")

# Models
class CheckoutSessionRequest(BaseModel):
    """Request model for creating a checkout session."""
    plan_id: str

# Dependency to get database instance
def get_db():
    """Get Firestore database instance."""
    db = FirestoreDB(project_id=project_id)
    return db

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the index page."""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "stripe_publishable_key": stripe_publishable_key
    })

@app.get("/success", response_class=HTMLResponse)
async def success(request: Request):
    """Serve the success page."""
    return templates.TemplateResponse("success.html", {"request": request})

@app.get("/cancel", response_class=HTMLResponse)
async def cancel(request: Request):
    """Serve the cancel page."""
    return templates.TemplateResponse("cancel.html", {"request": request})

@app.post("/create-checkout-session")
async def create_checkout_session(
    request: CheckoutSessionRequest,
    db: FirestoreDB = Depends(get_db)
):
    """
    Create a Stripe checkout session.
    
    Args:
        request (CheckoutSessionRequest): Checkout session request
        db (FirestoreDB): Firestore database instance
        
    Returns:
        dict: Checkout session ID
    """
    try:
        # Get the plan from the database
        plan = db.get_plan_by_id(request.plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail=f"Plan not found: {request.plan_id}")
        
        # Create the checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': plan['stripe_price_id'],
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=f"{request.base_url}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{request.base_url}/cancel",
        )
        
        return {"id": checkout_session.id}
        
    except Exception as e:
        logger.exception(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/plans")
async def get_plans(db: FirestoreDB = Depends(get_db)):
    """
    Get all pricing plans.
    
    Returns:
        dict: List of pricing plans
    """
    plans = db.get_plans()
    return {"status": "success", "plans": plans}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8082))
    uvicorn.run(app, host="0.0.0.0", port=port)
