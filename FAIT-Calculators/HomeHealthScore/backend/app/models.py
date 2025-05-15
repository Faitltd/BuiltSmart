from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class Repair(BaseModel):
    """Repair recommendation model"""
    system: str
    urgency: str
    notes: str

class AssessmentResult(BaseModel):
    """Assessment result model"""
    score: int = Field(..., ge=0, le=100)
    summary: str
    repairs: List[Repair]

class VoiceSession(BaseModel):
    """Voice session model"""
    id: Optional[str] = None
    user_id: str
    audio_url: Optional[str] = None
    transcript: Optional[str] = None
    status: str = "pending"
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class AssessmentResultDB(BaseModel):
    """Assessment result database model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    health_score: int = Field(..., ge=0, le=100)
    summary: str
    repairs: List[Dict[str, Any]]
    created_at: Optional[datetime] = None
    report_url: Optional[str] = None
    
    class Config:
        orm_mode = True
