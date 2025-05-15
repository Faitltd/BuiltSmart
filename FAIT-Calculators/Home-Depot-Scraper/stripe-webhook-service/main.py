from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import stripe
import os
import json
import sys
from dotenv import load_dotenv
import logging
from typing import Optional
from pydantic import BaseModel

# Add parent directory to path to import db module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import FirestoreDB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Stripe
stripe_api_key = os.getenv('STRIPE_MASTER_API_KEY')
webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')  # Will be set later
stripe.api_key = stripe_api_key

# Configure Firestore
project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'fait-444705')

# Create FastAPI app
app = FastAPI(title="Scraper Webhook Service",
              description="Webhook service for processing Stripe payments and managing credits")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Dependency to get database instance
def get_db():
    """Get Firestore database instance."""
    db = FirestoreDB(project_id=project_id)
    return db

@app.get("/")
async def root():
    """Root endpoint to check if the service is running."""
    return {"message": "Stripe webhook service is running", "status": "ok"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "scraper-webhook"}

@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: FirestoreDB = Depends(get_db)):
    """
    Stripe webhook endpoint for processing payment events.

    This endpoint handles various Stripe events, particularly focusing on
    completed checkout sessions to add credits to user accounts.
    """
    # Get the request body
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    logger.info("Received webhook from Stripe")

    try:
        if webhook_secret:
            # Verify the event using the webhook secret
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            # If no webhook secret is configured, parse the event without verification
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )

        # Log the event type
        logger.info(f"Processing event type: {event['type']}")

        # Handle different event types
        if event['type'] == 'checkout.session.completed':
            # Process the completed checkout session
            await process_checkout_session(event['data']['object'], db)

        elif event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            logger.info(f"Payment intent succeeded: {payment_intent['id']}")
            # We'll primarily use checkout.session.completed for credit management

        # Add more event types as needed

        return JSONResponse(content={"status": "success", "event_type": event['type']})

    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_checkout_session(session, db: FirestoreDB):
    """
    Process a completed checkout session.

    Args:
        session: Stripe checkout session object
        db: Firestore database instance
    """
    try:
        logger.info(f"Processing checkout session: {session['id']}")

        # Get the customer ID from the session
        customer_id = session.get('customer')
        if not customer_id:
            logger.error("No customer ID in session")
            return

        # Get the line items from the session
        line_items = stripe.checkout.Session.list_line_items(session['id'])

        if not line_items or not line_items.data:
            logger.error("No line items in session")
            return

        # Get the price ID from the first line item
        price_id = line_items.data[0].price.id

        # Get the plan from the database
        plan = db.get_plan_by_stripe_price_id(price_id)

        if not plan:
            logger.error(f"Plan not found for price ID: {price_id}")
            return

        # Get the user by Stripe customer ID
        # First, query users to find the one with this customer ID
        users_ref = db.db.collection('users')
        query = users_ref.where(filter=db.db._query_class.field_filter("stripe_customer_id", "==", customer_id))

        user = None
        for user_doc in query.stream():
            user = user_doc.to_dict()
            user['id'] = user_doc.id
            break

        if not user:
            # If user doesn't exist, we might need to create one
            # This depends on your user management flow
            logger.error(f"User not found for customer ID: {customer_id}")

            # Get customer details from Stripe
            customer = stripe.Customer.retrieve(customer_id)

            # Create a new user
            user = db.create_user(
                email=customer.email,
                name=customer.name or customer.email,
                stripe_customer_id=customer_id
            )

            if not user:
                logger.error("Failed to create user")
                return

        # Add credits to the user's account
        credits = plan.get('credits', 0)
        description = f"Purchased {credits} credits ({plan.get('name', 'Unknown plan')})"

        updated_user = db.add_credits(
            user_id=user['id'],
            credits=credits,
            description=description,
            stripe_payment_id=session['payment_intent']
        )

        if updated_user:
            logger.info(f"Added {credits} credits to user {user['id']}, new balance: {updated_user['credits']}")
        else:
            logger.error(f"Failed to add credits to user {user['id']}")

    except Exception as e:
        logger.exception(f"Error processing checkout session: {str(e)}")

# Models
class CheckoutSessionRequest(BaseModel):
    """Request model for creating a checkout session."""
    plan_id: str
    base_url: str

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
            success_url=f"{request.base_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{request.base_url}/checkout/cancel",
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

@app.get("/api/user/{user_id}")
async def get_user(user_id: str, db: FirestoreDB = Depends(get_db)):
    """
    Get a user by ID.

    Args:
        user_id (str): User ID

    Returns:
        dict: User data
    """
    user = db.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove sensitive information
    if 'api_key' in user:
        user['api_key'] = f"{user['api_key'][:4]}...{user['api_key'][-4:]}"

    return {"status": "success", "user": user}

@app.get("/api/user/email/{email}")
async def get_user_by_email(email: str, db: FirestoreDB = Depends(get_db)):
    """
    Get a user by email.

    Args:
        email (str): User's email address

    Returns:
        dict: User data
    """
    user = db.get_user_by_email(email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove sensitive information
    if 'api_key' in user:
        user['api_key'] = f"{user['api_key'][:4]}...{user['api_key'][-4:]}"

    return {"status": "success", "user": user}

@app.get("/api/transactions/{user_id}")
async def get_user_transactions(user_id: str, limit: int = 10, db: FirestoreDB = Depends(get_db)):
    """
    Get a user's transaction history.

    Args:
        user_id (str): User ID
        limit (int): Maximum number of transactions to return

    Returns:
        dict: List of transactions
    """
    # Check if user exists
    user = db.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    transactions = db.get_user_transactions(user_id, limit=limit)

    return {"status": "success", "transactions": transactions}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
