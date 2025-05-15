import { writable } from 'svelte/store';

// Define message interface
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Define conversation state interfaces
export enum ConversationStage {
  GREETING = 'greeting',
  ROOM_SELECTION = 'room_selection',
  ROOM_DIMENSIONS = 'room_dimensions',
  BUDGET = 'budget',
  DESIGN_PREFERENCES = 'design_preferences',
  PRODUCT_SUGGESTIONS = 'product_suggestions',
  SUMMARY = 'summary'
}

export enum RoomType {
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  LIVING_ROOM = 'living_room',
  BEDROOM = 'bedroom',
  BASEMENT = 'basement',
  OTHER = 'other'
}

export enum DesignStyle {
  MODERN = 'modern',
  TRADITIONAL = 'traditional',
  CONTEMPORARY = 'contemporary',
  FARMHOUSE = 'farmhouse',
  INDUSTRIAL = 'industrial',
  MINIMALIST = 'minimalist',
  RUSTIC = 'rustic',
  TRANSITIONAL = 'transitional'
}

export enum ProductCategory {
  CABINETS = 'cabinets',
  COUNTERTOPS = 'countertops',
  FLOORING = 'flooring',
  APPLIANCES = 'appliances',
  FIXTURES = 'fixtures',
  LIGHTING = 'lighting',
  PAINT = 'paint',
  TILE = 'tile',
  HARDWARE = 'hardware'
}

export interface RoomDimensions {
  length?: number;
  width?: number;
  squareFootage?: number;
}

export interface UserPreferences {
  designStyle?: DesignStyle;
  colorPreferences?: string[];
  materialPreferences?: string[];
}

export interface RoomInfo {
  type: RoomType;
  dimensions?: RoomDimensions;
  products?: any[];
}

export interface ConversationState {
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

// Create stores
export const chatHistory = writable<Message[]>([]);
export const isLoading = writable<boolean>(false);
export const chatbotState = writable<ConversationState | null>(null);
export const showSaveButton = writable<boolean>(false);
export const isSaving = writable<boolean>(false);
export const saveSuccess = writable<boolean>(false);

// Actions
export function addMessage(message: Message) {
  chatHistory.update(history => [...history, message]);
}

export function setLoading(loading: boolean) {
  isLoading.set(loading);
}

export function updateChatbotState(state: ConversationState) {
  chatbotState.set(state);
  
  // Show save button if we're at the summary stage
  if (state.stage === ConversationStage.SUMMARY) {
    showSaveButton.set(true);
  }
}

// Initialize chatbot
export function initializeChatbot(): { response: string; state: ConversationState } {
  const state: ConversationState = {
    stage: ConversationStage.GREETING,
    rooms: [],
    currentRoomIndex: -1,
    preferences: {}
  };
  
  const response = "Hi there! I'm BuildSmart by FAIT, your remodeling estimate assistant. I can help you create a detailed estimate for your project. What kind of remodeling are you planning?";
  
  chatbotState.set(state);
  
  return { response, state };
}
