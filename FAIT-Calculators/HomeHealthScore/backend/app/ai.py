import openai
import json
from .config import settings
from .models import AssessmentResult

# Initialize OpenAI client
openai.api_key = settings.OPENAI_API_KEY

async def transcribe_audio(file_path: str) -> str:
    """Transcribe audio file using OpenAI Whisper API"""
    with open(file_path, "rb") as audio_file:
        transcript = openai.Audio.transcribe("whisper-1", audio_file)
    return transcript["text"]

async def analyze_transcript(transcript: str) -> AssessmentResult:
    """Analyze transcript using OpenAI GPT-4 API"""
    system_prompt = """
    You are a home systems evaluator. The user gave voice responses about the condition of their home.
    Read the transcript, infer condition of key systems, and assign a Health Score from 0–100.
    Also provide a prioritized repair list. Be conservative, but not alarmist.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": transcript}
        ],
        functions=[
            {
                "name": "generate_assessment",
                "description": "Generate a home health assessment based on the transcript",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "score": {
                            "type": "integer",
                            "description": "Health score from 0-100"
                        },
                        "summary": {
                            "type": "string",
                            "description": "Summary of the home's condition"
                        },
                        "repairs": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "system": {
                                        "type": "string",
                                        "description": "Home system (e.g., Roof, HVAC, Plumbing)"
                                    },
                                    "urgency": {
                                        "type": "string",
                                        "enum": ["Urgent", "Soon", "Monitor"],
                                        "description": "Urgency of repair"
                                    },
                                    "notes": {
                                        "type": "string",
                                        "description": "Notes about the issue"
                                    }
                                },
                                "required": ["system", "urgency", "notes"]
                            }
                        }
                    },
                    "required": ["score", "summary", "repairs"]
                }
            }
        ],
        function_call={"name": "generate_assessment"}
    )
    
    function_call = response.choices[0].message.function_call
    result = json.loads(function_call.arguments)
    
    return AssessmentResult(
        score=result["score"],
        summary=result["summary"],
        repairs=result["repairs"]
    )

# Optional: ElevenLabs integration for voice responses
if settings.ELEVENLABS_API_KEY:
    import elevenlabs
    
    elevenlabs.set_api_key(settings.ELEVENLABS_API_KEY)
    
    async def generate_voice_response(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> bytes:
        """Generate voice response using ElevenLabs API"""
        audio = elevenlabs.generate(
            text=text,
            voice=voice_id,
            model="eleven_monolingual_v1"
        )
        return audio
