import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface VoiceRecorderProps {
  onRecordingComplete: (sessionId: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);
  
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        uploadAudio(audioBlob);
        
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const uploadAudio = async (audioBlob: Blob) => {
    if (!user) {
      setError('You must be logged in to upload audio.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Create a file from the blob
      const file = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);
      
      // Upload to API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-audio`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Call the callback with the session ID
      onRecordingComplete(data.session_id);
      
    } catch (err) {
      console.error('Error uploading audio:', err);
      setError('Failed to upload recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Voice Assessment</h2>
      
      {error && (
        <div className="w-full p-3 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="w-full mb-6 flex justify-center">
        {isRecording ? (
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-lg font-medium">Recording... {formatTime(recordingTime)}</span>
          </div>
        ) : isProcessing ? (
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </div>
        ) : (
          <span className="text-lg font-medium">Ready to record</span>
        )}
      </div>
      
      <div className="flex space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Stop Recording
          </button>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Talk about your home's condition naturally. Our AI will ask you questions about:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Your roof and any leaks</li>
          <li>Windows and doors</li>
          <li>HVAC system</li>
          <li>Plumbing and electrical</li>
          <li>Recent repairs or issues</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceRecorder;
