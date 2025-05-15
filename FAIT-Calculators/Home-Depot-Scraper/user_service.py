#!/usr/bin/env python3
"""
User Management API Service

This module provides a FastAPI service for user management,
including user creation, API key generation, and credit management.
"""

import os
import logging
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from db import FirestoreDB

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure Firestore
project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'fait-444705')

# Create FastAPI app
app = FastAPI(title="User Management API",
              description="API service for user management and credit tracking")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models
class UserResponse(BaseModel):
    """Response model for user endpoints."""
    status: str
    message: str
    user: Optional[Dict[str, Any]] = None

class CreateUserRequest(BaseModel):
    """Request model for user creation."""
    email: EmailStr
    name: str

class AddCreditsRequest(BaseModel):
    """Request model for adding credits."""
    user_id: str
    credits: int
    description: str
    stripe_payment_id: Optional[str] = None

# Dependency to get database instance
def get_db():
    """Get Firestore database instance."""
    db = FirestoreDB(project_id=project_id)
    return db

# Admin authentication middleware
async def verify_admin_key(x_admin_key: str = Header(...)):
    """
    Verify the admin API key.
    
    Args:
        x_admin_key (str): Admin API key from X-Admin-Key header
        
    Raises:
        HTTPException: If admin API key is invalid
    """
    admin_key = os.getenv('ADMIN_API_KEY')
    
    if not admin_key or x_admin_key != admin_key:
        raise HTTPException(status_code=401, detail="Invalid admin API key")
    
    return True

@app.get("/")
async def root():
    """Root endpoint to check if the service is running."""
    return {"message": "User Management API is running", "status": "ok"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "user-management"}

@app.post("/api/users", response_model=UserResponse)
async def create_user(
    request: CreateUserRequest,
    db: FirestoreDB = Depends(get_db),
    is_admin: bool = Depends(verify_admin_key)
):
    """
    Create a new user.
    
    Args:
        request (CreateUserRequest): User creation request
        db (FirestoreDB): Firestore database instance
        is_admin (bool): Admin authentication result
        
    Returns:
        UserResponse: User response
    """
    try:
        # Check if user already exists
        existing_user = db.get_user_by_email(request.email)
        
        if existing_user:
            return UserResponse(
                status="error",
                message=f"User with email {request.email} already exists",
                user=existing_user
            )
        
        # Create the user
        user = db.create_user(
            email=request.email,
            name=request.name
        )
        
        # Mask the API key for response
        if 'api_key' in user:
            user['api_key_masked'] = f"{user['api_key'][:4]}...{user['api_key'][-4:]}"
        
        return UserResponse(
            status="success",
            message="User created successfully",
            user=user
        )
        
    except Exception as e:
        logger.exception(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: FirestoreDB = Depends(get_db),
    is_admin: bool = Depends(verify_admin_key)
):
    """
    Get a user by ID.
    
    Args:
        user_id (str): User ID
        db (FirestoreDB): Firestore database instance
        is_admin (bool): Admin authentication result
        
    Returns:
        UserResponse: User response
    """
    try:
        user = db.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mask the API key for response
        if 'api_key' in user:
            user['api_key_masked'] = f"{user['api_key'][:4]}...{user['api_key'][-4:]}"
        
        return UserResponse(
            status="success",
            message="User retrieved successfully",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/email/{email}", response_model=UserResponse)
async def get_user_by_email(
    email: str,
    db: FirestoreDB = Depends(get_db),
    is_admin: bool = Depends(verify_admin_key)
):
    """
    Get a user by email.
    
    Args:
        email (str): User email
        db (FirestoreDB): Firestore database instance
        is_admin (bool): Admin authentication result
        
    Returns:
        UserResponse: User response
    """
    try:
        user = db.get_user_by_email(email)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mask the API key for response
        if 'api_key' in user:
            user['api_key_masked'] = f"{user['api_key'][:4]}...{user['api_key'][-4:]}"
        
        return UserResponse(
            status="success",
            message="User retrieved successfully",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/regenerate-api-key", response_model=UserResponse)
async def regenerate_api_key(
    user_id: str,
    db: FirestoreDB = Depends(get_db),
    is_admin: bool = Depends(verify_admin_key)
):
    """
    Regenerate a user's API key.
    
    Args:
        user_id (str): User ID
        db (FirestoreDB): Firestore database instance
        is_admin (bool): Admin authentication result
        
    Returns:
        UserResponse: User response
    """
    try:
        # Check if user exists
        user = db.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Regenerate the API key
        new_api_key = db.regenerate_api_key(user_id)
        
        if not new_api_key:
            raise HTTPException(status_code=500, detail="Failed to regenerate API key")
        
        # Get the updated user
        user = db.get_user_by_id(user_id)
        
        # Mask the API key for response
        if 'api_key' in user:
            user['api_key_masked'] = f"{user['api_key'][:4]}...{user['api_key'][-4:]}"
        
        return UserResponse(
            status="success",
            message="API key regenerated successfully",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error regenerating API key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/add-credits", response_model=UserResponse)
async def add_credits(
    user_id: str,
    request: AddCreditsRequest,
    db: FirestoreDB = Depends(get_db),
    is_admin: bool = Depends(verify_admin_key)
):
    """
    Add credits to a user's account.
    
    Args:
        user_id (str): User ID
        request (AddCreditsRequest): Add credits request
        db (FirestoreDB): Firestore database instance
        is_admin (bool): Admin authentication result
        
    Returns:
        UserResponse: User response
    """
    try:
        # Check if user exists
        user = db.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Add credits
        updated_user = db.add_credits(
            user_id=user_id,
            credits=request.credits,
            description=request.description,
            stripe_payment_id=request.stripe_payment_id
        )
        
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to add credits")
        
        # Mask the API key for response
        if 'api_key' in updated_user:
            updated_user['api_key_masked'] = f"{updated_user['api_key'][:4]}...{updated_user['api_key'][-4:]}"
        
        return UserResponse(
            status="success",
            message=f"Added {request.credits} credits successfully",
            user=updated_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error adding credits: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/transactions")
async def get_user_transactions(
    user_id: str,
    limit: int = 10,
    db: FirestoreDB = Depends(get_db),
    is_admin: bool = Depends(verify_admin_key)
):
    """
    Get a user's transaction history.
    
    Args:
        user_id (str): User ID
        limit (int): Maximum number of transactions to return
        db (FirestoreDB): Firestore database instance
        is_admin (bool): Admin authentication result
        
    Returns:
        dict: Transaction history
    """
    try:
        # Check if user exists
        user = db.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get transactions
        transactions = db.get_user_transactions(user_id, limit=limit)
        
        return {
            "status": "success",
            "message": "Transactions retrieved successfully",
            "transactions": transactions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8083))
    uvicorn.run(app, host="0.0.0.0", port=port)
