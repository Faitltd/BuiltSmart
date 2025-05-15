import axios from 'axios';
import { ConversationStage, RoomType, DesignStyle, ProductCategory } from '../utils/conversationFlow';

// Define interfaces locally to avoid import issues
interface RoomDimensions {
  length?: number;
  width?: number;
  squareFootage?: number;
  ceilingHeight?: number;
}

interface RoomInfo {
  type: RoomType;
  dimensions?: RoomDimensions;
  products?: ProductCategory[];
}

interface UserPreferences {
  designStyle?: DesignStyle;
  colorPreferences?: string[];
  materialPreferences?: string[];
  brandPreferences?: string[];
  priorityFeatures?: string[];
}

interface ConversationState {
  stage: ConversationStage;
  rooms: RoomInfo[];
  currentRoomIndex: number;
  budget?: {
    min: number;
    max: number;
  };
  preferences: UserPreferences;
  productSuggestions?: any[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const generateGptResponse = async (
  state: ConversationState,
  userInput: string,
  chatHistory: Message[]
): Promise<{ response: string; updatedState: ConversationState }> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
    const response = await axios.post(`${apiUrl}/api/chatbot/gpt-chat`, {
      state,
      userInput,
      chatHistory,
    });

    return response.data;
  } catch (error) {
    console.error('Error generating GPT response:', error);
    return {
      response: "I'm sorry, I'm having trouble processing your request right now. Could you please try again?",
      updatedState: state,
    };
  }
};
