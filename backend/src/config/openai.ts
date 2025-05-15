import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OpenAI API key is not configured. Chatbot will not function properly.');
}
