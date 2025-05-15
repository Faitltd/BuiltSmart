#!/usr/bin/env python3
"""
API Service for Scraper with Credit Management

This module provides a FastAPI service for the scraper with credit management.
It includes endpoints for scraping products, searching, and managing user credits.
"""

import os
import json
import logging
import requests
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
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

# API keys
BIGBOX_API_KEY = os.getenv('BIGBOX_API_KEY', '52323740B6D14CBE81D81C81E0DD32E6')
LOWES_API_KEY = os.getenv('LOWES_API_KEY', 'D302834B9CC3400FA921A2F2D384ADD6')

# Configure Firestore
project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'fait-444705')

# Create FastAPI app
app = FastAPI(title="Scraper API Service",
              description="API service for scraping with credit management")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# BigBox API base URL
BIGBOX_API_URL = "https://api.bigboxapi.com/request"

# Models
class ScraperResponse(BaseModel):
    """Response model for scraper endpoints."""
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    credits_used: Optional[int] = None
    credits_remaining: Optional[int] = None

class ProductRequest(BaseModel):
    """Request model for product scraping."""
    url: Optional[str] = None
    item_id: Optional[str] = None
    source: str = "homedepot"  # homedepot or lowes

class SearchRequest(BaseModel):
    """Request model for search scraping."""
    query: str
    source: str = "homedepot"  # homedepot or lowes
    zipcode: Optional[str] = None
    sort_by: Optional[str] = None
    page: int = 1

class CategoryRequest(BaseModel):
    """Request model for category scraping."""
    category_id: str
    source: str = "homedepot"  # homedepot or lowes
    page: int = 1

# Dependency to get database instance
def get_db():
    """Get Firestore database instance."""
    db = FirestoreDB(project_id=project_id)
    return db

# Authentication middleware
async def verify_api_key(x_api_key: str = Header(...), db: FirestoreDB = Depends(get_db)):
    """
    Verify the API key and get the associated user.
    
    Args:
        x_api_key (str): API key from X-API-Key header
        db (FirestoreDB): Firestore database instance
        
    Returns:
        dict: User data
        
    Raises:
        HTTPException: If API key is invalid
    """
    user = db.get_user_by_api_key(x_api_key)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return user

@app.get("/")
async def root():
    """Root endpoint to check if the service is running."""
    return {"message": "Scraper API service is running", "status": "ok"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "scraper-api"}

@app.post("/api/scrape/product", response_model=ScraperResponse)
async def scrape_product(
    request: ProductRequest,
    user: dict = Depends(verify_api_key),
    db: FirestoreDB = Depends(get_db)
):
    """
    Scrape a product from Home Depot or Lowe's.
    
    Args:
        request (ProductRequest): Product request
        user (dict): User data from API key verification
        db (FirestoreDB): Firestore database instance
        
    Returns:
        ScraperResponse: Scraper response
    """
    # Get credit costs
    costs = db.get_costs()
    credits_required = costs.get('product_scrape', 1)
    
    # Check if user has enough credits
    if user.get('credits', 0) < credits_required:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Required: {credits_required}, Available: {user.get('credits', 0)}"
        )
    
    try:
        # Prepare API request
        params = {
            'api_key': BIGBOX_API_KEY if request.source == 'homedepot' else LOWES_API_KEY,
            'type': 'product',
            'source': request.source
        }
        
        if request.url:
            params['url'] = request.url
        elif request.item_id:
            params['item_id'] = request.item_id
        else:
            raise HTTPException(status_code=400, detail="Either url or item_id must be provided")
        
        # Make API request
        response = requests.get(BIGBOX_API_URL, params=params)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Use credits
        description = f"Product scrape: {request.url or request.item_id} ({request.source})"
        updated_user = db.use_credits(user['id'], credits_required, description)
        
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update credits")
        
        # Return response
        return ScraperResponse(
            status="success",
            message="Product scraped successfully",
            data=data,
            credits_used=credits_required,
            credits_remaining=updated_user.get('credits', 0)
        )
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"API request failed: {str(e)}")
    except Exception as e:
        logger.exception(f"Error scraping product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape/search", response_model=ScraperResponse)
async def scrape_search(
    request: SearchRequest,
    user: dict = Depends(verify_api_key),
    db: FirestoreDB = Depends(get_db)
):
    """
    Scrape search results from Home Depot or Lowe's.
    
    Args:
        request (SearchRequest): Search request
        user (dict): User data from API key verification
        db (FirestoreDB): Firestore database instance
        
    Returns:
        ScraperResponse: Scraper response
    """
    # Get credit costs
    costs = db.get_costs()
    credits_required = costs.get('search_scrape', 5)
    
    # Check if user has enough credits
    if user.get('credits', 0) < credits_required:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Required: {credits_required}, Available: {user.get('credits', 0)}"
        )
    
    try:
        # Prepare API request
        params = {
            'api_key': BIGBOX_API_KEY if request.source == 'homedepot' else LOWES_API_KEY,
            'type': 'search',
            'search_term': request.query,
            'source': request.source,
            'page': request.page
        }
        
        if request.zipcode:
            params['zipcode'] = request.zipcode
        
        if request.sort_by:
            params['sort_by'] = request.sort_by
        
        # Make API request
        response = requests.get(BIGBOX_API_URL, params=params)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Use credits
        description = f"Search scrape: {request.query} ({request.source})"
        updated_user = db.use_credits(user['id'], credits_required, description)
        
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update credits")
        
        # Return response
        return ScraperResponse(
            status="success",
            message="Search results scraped successfully",
            data=data,
            credits_used=credits_required,
            credits_remaining=updated_user.get('credits', 0)
        )
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"API request failed: {str(e)}")
    except Exception as e:
        logger.exception(f"Error scraping search results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape/category", response_model=ScraperResponse)
async def scrape_category(
    request: CategoryRequest,
    user: dict = Depends(verify_api_key),
    db: FirestoreDB = Depends(get_db)
):
    """
    Scrape category products from Home Depot or Lowe's.
    
    Args:
        request (CategoryRequest): Category request
        user (dict): User data from API key verification
        db (FirestoreDB): Firestore database instance
        
    Returns:
        ScraperResponse: Scraper response
    """
    # Get credit costs
    costs = db.get_costs()
    credits_required = costs.get('category_scrape', 10)
    
    # Check if user has enough credits
    if user.get('credits', 0) < credits_required:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Required: {credits_required}, Available: {user.get('credits', 0)}"
        )
    
    try:
        # Prepare API request
        params = {
            'api_key': BIGBOX_API_KEY if request.source == 'homedepot' else LOWES_API_KEY,
            'type': 'category',
            'category_id': request.category_id,
            'source': request.source,
            'page': request.page
        }
        
        # Make API request
        response = requests.get(BIGBOX_API_URL, params=params)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Use credits
        description = f"Category scrape: {request.category_id} ({request.source})"
        updated_user = db.use_credits(user['id'], credits_required, description)
        
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update credits")
        
        # Return response
        return ScraperResponse(
            status="success",
            message="Category products scraped successfully",
            data=data,
            credits_used=credits_required,
            credits_remaining=updated_user.get('credits', 0)
        )
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"API request failed: {str(e)}")
    except Exception as e:
        logger.exception(f"Error scraping category products: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/credits", response_model=ScraperResponse)
async def get_user_credits(
    user: dict = Depends(verify_api_key),
    db: FirestoreDB = Depends(get_db)
):
    """
    Get the user's credit balance.
    
    Args:
        user (dict): User data from API key verification
        db (FirestoreDB): Firestore database instance
        
    Returns:
        ScraperResponse: Scraper response with credit information
    """
    try:
        # Get the latest user data
        user = db.get_user_by_id(user['id'])
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return response
        return ScraperResponse(
            status="success",
            message="Credits retrieved successfully",
            data={"credits": user.get('credits', 0)},
            credits_remaining=user.get('credits', 0)
        )
        
    except Exception as e:
        logger.exception(f"Error getting user credits: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/costs", response_model=ScraperResponse)
async def get_credit_costs(db: FirestoreDB = Depends(get_db)):
    """
    Get the credit costs for different operations.
    
    Args:
        db (FirestoreDB): Firestore database instance
        
    Returns:
        ScraperResponse: Scraper response with cost information
    """
    try:
        # Get costs
        costs = db.get_costs()
        
        # Return response
        return ScraperResponse(
            status="success",
            message="Credit costs retrieved successfully",
            data={"costs": costs}
        )
        
    except Exception as e:
        logger.exception(f"Error getting credit costs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8081))
    uvicorn.run(app, host="0.0.0.0", port=port)
