from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional
import os
import uuid
from . import db, ai, models

router = APIRouter()

async def process_voice_session(session_id: str, file_path: str):
    """Process a voice session in the background"""
    try:
        # Update session status
        db.update_session(session_id, {"status": "processing"})
        
        # Transcribe audio
        transcript = await ai.transcribe_audio(file_path)
        
        # Update session with transcript
        db.update_session(session_id, {"transcript": transcript})
        
        # Analyze transcript
        result = await ai.analyze_transcript(transcript)
        
        # Save assessment result
        db.create_assessment_result({
            "session_id": session_id,
            "health_score": result.score,
            "summary": result.summary,
            "repairs": result.repairs
        })
        
        # Update session status
        db.update_session(session_id, {"status": "completed"})
    
    except Exception as e:
        # Update session status to failed
        db.update_session(session_id, {
            "status": "failed",
            "error": str(e)
        })
        
        # Log error
        print(f"Error processing session {session_id}: {str(e)}")

@router.get("/")
async def root():
    return {"message": "Home Health Score API"}

@router.post("/upload-audio")
async def upload_audio(
    background_tasks: BackgroundTasks,
    user_id: str,
    file: UploadFile = File(...)
):
    """Upload audio file and start processing"""
    try:
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Save file temporarily
        file_path = f"/tmp/{session_id}.wav"
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Upload to Supabase Storage
        with open(file_path, "rb") as f:
            db.upload_file_to_storage(
                "audio-uploads",
                f"{user_id}/{session_id}.wav",
                f
            )
        
        # Get file URL
        file_url = db.get_public_url(
            "audio-uploads",
            f"{user_id}/{session_id}.wav"
        )
        
        # Create session record
        session = models.VoiceSession(
            id=session_id,
            user_id=user_id,
            audio_url=file_url,
            status="pending"
        )
        
        db.create_session({
            "id": session.id,
            "user_id": session.user_id,
            "audio_url": session.audio_url,
            "status": session.status
        })
        
        # Start background processing
        background_tasks.add_task(process_voice_session, session_id, file_path)
        
        return {"session_id": session_id, "status": "processing"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session status and result if available"""
    try:
        # Get session
        session = db.get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # If session is completed, get assessment result
        if session["status"] == "completed":
            result = db.get_assessment_result(session_id)
            
            if result:
                return {
                    "session": session,
                    "result": result
                }
        
        return {"session": session}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
