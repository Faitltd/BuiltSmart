/**
 * Chatbot handler for the BuildSmart application
 * Manages conversation flow and generates responses
 */

import {
  ConversationStage,
  RoomType,
  DesignStyle,
  ProductCategory,
  initializeConversation,
  detectRoomTypes,
  extractDimensions,
  extractBudget,
  detectDesignStyle,
  getProductCategoriesForRoom
} from './conversationFlow';

// Define RoomDimensions interface locally to avoid import issues
interface RoomDimensions {
  length?: number;
  width?: number;
  squareFootage?: number;
  ceilingHeight?: number;
}

// Define RoomInfo interface locally to avoid import issues
interface RoomInfo {
  type: RoomType;
  dimensions?: RoomDimensions;
  products?: ProductCategory[];
}

// Define UserPreferences interface locally to avoid import issues
interface UserPreferences {
  designStyle?: DesignStyle;
  colorPreferences?: string[];
  materialPreferences?: string[];
  brandPreferences?: string[];
  priorityFeatures?: string[];
}

// Define ConversationState interface locally to avoid import issues
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

import { searchHomeDepotProducts } from '../mocks/homeDepotProducts';

// Define HomeDepotProduct interface locally to avoid import issues
interface HomeDepotProduct {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  description: string;
  features: string[];
  roomTypes: RoomType[];
  designStyles: DesignStyle[];
  imageUrl: string;
  productUrl: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

import { laborRates, hourlyRates, fixtureRates } from '../mocks/laborData';

/**
 * Generate a response based on the current conversation state and user input
 */
export const generateChatbotResponse = (
  state: ConversationState,
  userInput: string
): { response: string; updatedState: ConversationState } => {
  // Create a copy of the state to modify
  const updatedState = { ...state };
  let response = '';

  // Handle different conversation stages
  switch (state.stage) {
    case ConversationStage.GREETING:
      response = handleGreeting(updatedState, userInput);
      break;
    case ConversationStage.ROOM_SELECTION:
      response = handleRoomSelection(updatedState, userInput);
      break;
    case ConversationStage.ROOM_DIMENSIONS:
      response = handleRoomDimensions(updatedState, userInput);
      break;
    case ConversationStage.BUDGET:
      response = handleBudget(updatedState, userInput);
      break;
    case ConversationStage.DESIGN_PREFERENCES:
      response = handleDesignPreferences(updatedState, userInput);
      break;
    case ConversationStage.PRODUCT_SUGGESTIONS:
      response = handleProductSuggestions(updatedState, userInput);
      break;
    case ConversationStage.SUMMARY:
      response = handleSummary(updatedState, userInput);
      break;
    default:
      response = "I'm not sure where we are in our conversation. Let's start over. Which room(s) are you planning to remodel?";
      updatedState.stage = ConversationStage.ROOM_SELECTION;
  }

  return { response, updatedState };
};

/**
 * Handle the greeting stage
 */
const handleGreeting = (state: ConversationState, userInput: string): string => {
  // Move to room selection stage
  state.stage = ConversationStage.ROOM_SELECTION;

  return "Hi there! I'm BuildSmart by FAIT, your remodeling estimate assistant. I can help you create a detailed estimate for your project. Which room or rooms are you thinking of remodeling today? (e.g., kitchen, bathroom, living room)";
};

/**
 * Handle the room selection stage
 */
const handleRoomSelection = (state: ConversationState, userInput: string): string => {
  // Detect rooms from user input
  const detectedRooms = detectRoomTypes(userInput);

  if (detectedRooms.length === 0) {
    return "I'm not sure which rooms you'd like to remodel. Could you please specify the rooms more clearly? For example: kitchen, bathroom, living room, etc.";
  }

  // Add detected rooms to state
  detectedRooms.forEach(roomType => {
    state.rooms.push({
      type: roomType,
      products: getProductCategoriesForRoom(roomType)
    });
  });

  // Move to room dimensions stage and set current room
  state.stage = ConversationStage.ROOM_DIMENSIONS;
  state.currentRoomIndex = 0;

  const currentRoom = state.rooms[state.currentRoomIndex];

  // Format room list for response
  const roomList = detectedRooms.map(room => room.replace('_', ' ')).join(', ');

  return `Great! I'll help you create an estimate for your ${roomList} remodel. Let's start with the ${currentRoom.type}. Could you please tell me the approximate dimensions? You can provide the length and width (e.g., "10 feet by 12 feet") or the total square footage.`;
};

/**
 * Handle the room dimensions stage
 */
const handleRoomDimensions = (state: ConversationState, userInput: string): string => {
  // Extract dimensions from user input
  const dimensions = extractDimensions(userInput);

  if (!dimensions) {
    return "I couldn't determine the dimensions from your input. Please provide the length and width (e.g., '10 feet by 12 feet') or the total square footage (e.g., '120 square feet').";
  }

  // Add dimensions to current room
  const currentRoom = state.rooms[state.currentRoomIndex];
  currentRoom.dimensions = dimensions;

  // Check if we need to get dimensions for more rooms
  if (state.currentRoomIndex < state.rooms.length - 1) {
    // Move to next room
    state.currentRoomIndex++;
    const nextRoom = state.rooms[state.currentRoomIndex];

    return `Thanks for the ${currentRoom.type} dimensions. Now, what are the dimensions of your ${nextRoom.type}?`;
  } else {
    // Move to budget stage
    state.stage = ConversationStage.BUDGET;

    // Format room list for response
    const roomList = state.rooms.map(room => room.type).join(' and ');

    return `Thanks for providing all the room dimensions. Now, thinking about the overall project for your ${roomList}, do you have an estimated budget range in mind? This will help me understand what kind of options we can explore.`;
  }
};

/**
 * Handle the budget stage
 */
const handleBudget = (state: ConversationState, userInput: string): string => {
  // Extract budget from user input
  const budget = extractBudget(userInput);

  if (!budget) {
    return "I couldn't determine your budget from your input. Could you please provide an estimated budget range? For example, '$20,000 to $30,000' or 'around $25,000'.";
  }

  // Add budget to state
  state.budget = budget;

  // Move to design preferences stage
  state.stage = ConversationStage.DESIGN_PREFERENCES;

  return "Thanks for sharing your budget. Now, what kind of style or aesthetic are you hoping to achieve with your remodel? For example, modern, traditional, farmhouse, minimalist, etc.";
};

/**
 * Handle the design preferences stage
 */
const handleDesignPreferences = (state: ConversationState, userInput: string): string => {
  // Detect design style from user input
  const designStyle = detectDesignStyle(userInput);

  if (!designStyle) {
    state.preferences.designStyle = DesignStyle.OTHER;
  } else {
    state.preferences.designStyle = designStyle;
  }

  // Extract any color preferences
  if (userInput.toLowerCase().includes('color')) {
    const colorRegex = /(?:color|colours?|colors?)[:\\s]*(\\w+(?:[,\\s]+\\w+)*)/i;
    const colorMatch = userInput.match(colorRegex);
    if (colorMatch) {
      state.preferences.colorPreferences = colorMatch[1].split(/[,\\s]+/).filter(Boolean);
    }
  }

  // Move to product suggestions stage
  state.stage = ConversationStage.PRODUCT_SUGGESTIONS;

  // Get product categories for the first room
  const firstRoom = state.rooms[0];
  const productCategories = firstRoom.products || getProductCategoriesForRoom(firstRoom.type);

  // Format product categories for response
  const categoryList = productCategories
    .slice(0, 3)
    .map(category => category.toLowerCase())
    .join(', ');

  return `I understand you're looking for a ${state.preferences.designStyle?.toLowerCase()} style. Based on your ${firstRoom.type} remodel, would you like to see some product suggestions for ${categoryList}, or is there a specific category you're interested in?`;
};

/**
 * Handle the product suggestions stage
 */
const handleProductSuggestions = (state: ConversationState, userInput: string): string => {
  // Determine which product category the user is interested in
  let targetCategory: ProductCategory | undefined;

  for (const category of Object.values(ProductCategory)) {
    if (userInput.toLowerCase().includes(category.toLowerCase())) {
      targetCategory = category;
      break;
    }
  }

  if (!targetCategory) {
    // If no specific category mentioned, use the first category from the first room
    const firstRoom = state.rooms[0];
    targetCategory = (firstRoom.products && firstRoom.products.length > 0)
      ? firstRoom.products[0]
      : ProductCategory.FLOORING;
  }

  // Search for products based on room type, design style, and category
  const products = searchHomeDepotProducts('', {
    category: targetCategory,
    roomType: state.rooms[0].type,
    designStyle: state.preferences.designStyle,
    priceRange: state.budget
  });

  // Store product suggestions in state
  state.productSuggestions = products;

  // Move to summary stage
  state.stage = ConversationStage.SUMMARY;

  if (products.length === 0) {
    return `I couldn't find any ${targetCategory.toLowerCase()} products that match your criteria. Would you like to see options for a different category, or should I provide a summary of your project?`;
  }

  // Format product suggestions
  let response = `Here are some ${targetCategory.toLowerCase()} options from Home Depot that might work for your ${state.rooms[0].type} remodel:\n\n`;

  products.slice(0, 3).forEach((product, index) => {
    response += `${index + 1}. ${product.name} - $${product.price.toFixed(2)}\n`;
    response += `   ${product.description}\n`;
    response += `   Brand: ${product.brand} | Rating: ${product.rating}/5 (${product.reviewCount} reviews)\n\n`;
  });

  response += `Would you like to see more ${targetCategory.toLowerCase()} options, explore a different category, or should I provide a summary of your project?`;

  return response;
};

/**
 * Handle the summary stage
 */
const handleSummary = (state: ConversationState, userInput: string): string => {
  // Check if user wants to see more products
  if (userInput.toLowerCase().includes('more') ||
      userInput.toLowerCase().includes('other') ||
      userInput.toLowerCase().includes('different')) {
    // Stay in product suggestions stage
    state.stage = ConversationStage.PRODUCT_SUGGESTIONS;
    return handleProductSuggestions(state, userInput);
  }

  // Generate project summary
  let response = "Here's a summary of your remodeling project:\n\n";

  // Rooms and dimensions
  response += "ROOMS:\n";
  state.rooms.forEach(room => {
    response += `- ${room.type.charAt(0).toUpperCase() + room.type.slice(1)}`;

    if (room.dimensions) {
      if (room.dimensions.length && room.dimensions.width) {
        response += ` (${room.dimensions.length}' x ${room.dimensions.width}' = ${room.dimensions.squareFootage} sq ft)`;
      } else if (room.dimensions.squareFootage) {
        response += ` (${room.dimensions.squareFootage} sq ft)`;
      }
    }

    response += "\n";
  });

  // Budget
  if (state.budget) {
    response += `\nBUDGET: $${state.budget.min.toLocaleString()} - $${state.budget.max.toLocaleString()}\n`;
  }

  // Design preferences
  if (state.preferences.designStyle) {
    response += `\nDESIGN STYLE: ${state.preferences.designStyle}\n`;
  }

  // Product suggestions
  if (state.productSuggestions && state.productSuggestions.length > 0) {
    const category = state.productSuggestions[0].category;
    response += `\nSUGGESTED ${category.toUpperCase()}:\n`;

    state.productSuggestions.slice(0, 3).forEach((product, index) => {
      response += `- ${product.name} ($${product.price.toFixed(2)})\n`;
    });
  }

  response += "\nWould you like to add another room to your project, explore different product categories, or get a cost estimate based on this information?";

  return response;
};

/**
 * Save project data from conversation to Supabase
 */
import {
  createProject,
  createRoom,
  createDesignPreference,
  addProductToRoom
} from './dataService';

export const saveProjectToSupabase = async (
  state: ConversationState,
  userId: string
): Promise<string | null> => {
  try {
    // Create project
    const project = await createProject({
      user_id: userId,
      name: `${state.rooms.map(r => r.type).join(', ')} Remodel`,
      description: 'Created from BuildSmart conversation',
      budget_min: state.budget?.min || 0,
      budget_max: state.budget?.max || 0,
    });

    // Create rooms
    for (const room of state.rooms) {
      const roomData = await createRoom({
        project_id: project.id,
        type: room.type,
        length: room.dimensions?.length,
        width: room.dimensions?.width,
        square_footage: room.dimensions?.squareFootage,
      });

      // Save selected products if any
      if (state.productSuggestions && state.productSuggestions.length > 0) {
        for (const product of state.productSuggestions.slice(0, 3)) {
          await addProductToRoom({
            room_id: roomData.id,
            product_id: product.id,
            category: product.category,
            name: product.name,
            price: product.price,
            quantity: 1,
          });
        }
      }
    }

    // Save design preferences
    if (state.preferences.designStyle) {
      await createDesignPreference({
        project_id: project.id,
        style: state.preferences.designStyle,
        color_preferences: state.preferences.colorPreferences,
        material_preferences: state.preferences.materialPreferences,
      });
    }

    return project.id;
  } catch (error) {
    console.error('Error saving project to Supabase:', error);
    return null;
  }
};

/**
 * Initialize a new chatbot conversation
 */
export const initializeChatbot = (): { response: string; state: ConversationState } => {
  const state = initializeConversation();
  const response = handleGreeting(state, '');

  return { response, state };
};
