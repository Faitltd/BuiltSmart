import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json
import os
import sys

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from app.models import AssessmentResult

client = TestClient(app)

@pytest.fixture
def mock_supabase():
    with patch('app.db.supabase') as mock:
        yield mock

@pytest.fixture
def mock_openai():
    with patch('app.ai.openai') as mock:
        yield mock

def test_root():
    response = client.get("/api/v1/")
    assert response.status_code == 200
    assert response.json() == {"message": "Home Health Score API"}

def test_get_session_not_found(mock_supabase):
    # Mock the Supabase response for a non-existent session
    mock_supabase.table().select().eq().execute.return_value.data = []
    
    response = client.get("/api/v1/session/non-existent-id")
    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}

def test_get_session_pending(mock_supabase):
    # Mock the Supabase response for a pending session
    mock_session = {
        "id": "test-session-id",
        "user_id": "test-user-id",
        "status": "pending",
        "audio_url": "https://example.com/audio.wav",
        "transcript": None
    }
    mock_supabase.table().select().eq().execute.return_value.data = [mock_session]
    
    response = client.get("/api/v1/session/test-session-id")
    assert response.status_code == 200
    assert response.json() == {"session": mock_session}

def test_get_session_completed(mock_supabase):
    # Mock the Supabase response for a completed session with results
    mock_session = {
        "id": "test-session-id",
        "user_id": "test-user-id",
        "status": "completed",
        "audio_url": "https://example.com/audio.wav",
        "transcript": "This is a test transcript"
    }
    mock_result = {
        "id": "test-result-id",
        "session_id": "test-session-id",
        "health_score": 75,
        "summary": "This is a test summary",
        "repairs": [
            {
                "system": "Roof",
                "urgency": "Soon",
                "notes": "Needs repair"
            }
        ]
    }
    
    # Set up the mock to return the session and then the result
    mock_supabase.table().select().eq().execute.side_effect = [
        MagicMock(data=[mock_session]),
        MagicMock(data=[mock_result])
    ]
    
    response = client.get("/api/v1/session/test-session-id")
    assert response.status_code == 200
    assert response.json() == {
        "session": mock_session,
        "result": mock_result
    }

@pytest.mark.asyncio
async def test_analyze_transcript(mock_openai):
    # Mock the OpenAI response
    mock_function_call = MagicMock()
    mock_function_call.arguments = json.dumps({
        "score": 75,
        "summary": "This is a test summary",
        "repairs": [
            {
                "system": "Roof",
                "urgency": "Soon",
                "notes": "Needs repair"
            }
        ]
    })
    
    mock_openai.ChatCompletion.create.return_value.choices = [
        MagicMock(message=MagicMock(function_call=mock_function_call))
    ]
    
    # Import the function here to avoid circular imports in the test setup
    from app.ai import analyze_transcript
    
    result = await analyze_transcript("This is a test transcript")
    
    assert isinstance(result, AssessmentResult)
    assert result.score == 75
    assert result.summary == "This is a test summary"
    assert len(result.repairs) == 1
    assert result.repairs[0].system == "Roof"
    assert result.repairs[0].urgency == "Soon"
    assert result.repairs[0].notes == "Needs repair"
