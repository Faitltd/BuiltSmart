from supabase import create_client, Client
from .config import settings

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

def get_session(session_id: str):
    """Get a voice session by ID"""
    response = supabase.table("voice_sessions").select("*").eq("id", session_id).execute()
    return response.data[0] if response.data else None

def update_session(session_id: str, data: dict):
    """Update a voice session"""
    return supabase.table("voice_sessions").update(data).eq("id", session_id).execute()

def create_session(session_data: dict):
    """Create a new voice session"""
    return supabase.table("voice_sessions").insert(session_data).execute()

def get_assessment_result(session_id: str):
    """Get assessment result by session ID"""
    response = supabase.table("assessment_results").select("*").eq("session_id", session_id).execute()
    return response.data[0] if response.data else None

def create_assessment_result(result_data: dict):
    """Create a new assessment result"""
    return supabase.table("assessment_results").insert(result_data).execute()

def upload_file_to_storage(bucket: str, path: str, file_content):
    """Upload a file to Supabase Storage"""
    return supabase.storage.from_(bucket).upload(path, file_content)

def get_public_url(bucket: str, path: str):
    """Get public URL for a file in Supabase Storage"""
    return supabase.storage.from_(bucket).get_public_url(path)
