import type { ConversationState, RoomType, DesignStyle } from '$lib/stores/chatStore';
import { ConversationStage } from '$lib/stores/chatStore';
import { 
  createProject, 
  createRoom, 
  createDesignPreference, 
  addProductToRoom 
} from './dataService';

/**
 * Generate a chatbot response based on the current state and user input
 */
export function generateChatbotResponse(
  state: ConversationState,
  userMessage: string
): { response: string; updatedState: ConversationState } {
  const lowerMessage = userMessage.toLowerCase();
  const updatedState = { ...state };
  let response = '';

  // Handle different conversation stages
  switch (state.stage) {
    case ConversationStage.GREETING:
      response = handleRoomSelection(updatedState, userMessage);
      break;
    
    case ConversationStage.ROOM_SELECTION:
      response = handleRoomDimensions(updatedState, userMessage);
      break;
    
    case ConversationStage.ROOM_DIMENSIONS:
      response = handleBudget(updatedState, userMessage);
      break;
    
    case ConversationStage.BUDGET:
      response = handleDesignPreferences(updatedState, userMessage);
      break;
    
    case ConversationStage.DESIGN_PREFERENCES:
      response = handleProductSuggestions(updatedState, userMessage);
      break;
    
    case ConversationStage.PRODUCT_SUGGESTIONS:
      response = handleSummary(updatedState, userMessage);
      break;
    
    case ConversationStage.SUMMARY:
      response = "Your estimate is complete! You can save it to your account or make changes if needed.";
      break;
    
    default:
      response = "I'm not sure how to respond to that. Let's start over. What kind of remodeling project are you planning?";
      updatedState.stage = ConversationStage.GREETING;
  }

  return { response, updatedState };
}

/**
 * Handle room selection stage
 */
function handleRoomSelection(state: ConversationState, userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect room type
  let roomType: RoomType | null = null;
  
  if (lowerMessage.includes('kitchen')) {
    roomType = RoomType.KITCHEN;
  } else if (lowerMessage.includes('bathroom') || lowerMessage.includes('bath')) {
    roomType = RoomType.BATHROOM;
  } else if (lowerMessage.includes('living') || lowerMessage.includes('family')) {
    roomType = RoomType.LIVING_ROOM;
  } else if (lowerMessage.includes('bedroom') || lowerMessage.includes('bed room')) {
    roomType = RoomType.BEDROOM;
  } else if (lowerMessage.includes('basement')) {
    roomType = RoomType.BASEMENT;
  }
  
  if (roomType) {
    // Add room to state
    state.rooms.push({
      type: roomType
    });
    
    state.currentRoomIndex = state.rooms.length - 1;
    state.stage = ConversationStage.ROOM_DIMENSIONS;
    
    return `Great! Let's talk about your ${roomType} remodel. What are the dimensions of the room? (e.g., 10x12 feet)`;
  } else {
    return "I'm not sure which room you're referring to. Could you specify if it's a kitchen, bathroom, living room, bedroom, or basement?";
  }
}

/**
 * Handle room dimensions stage
 */
function handleRoomDimensions(state: ConversationState, userMessage: string): string {
  const dimensionsRegex = /(\d+)\s*(?:x|by)\s*(\d+)/i;
  const squareFootageRegex = /(\d+)\s*(?:sq\s*ft|square\s*feet|square\s*foot)/i;
  
  const dimensionsMatch = userMessage.match(dimensionsRegex);
  const squareFootageMatch = userMessage.match(squareFootageRegex);
  
  if (dimensionsMatch) {
    const length = parseInt(dimensionsMatch[1]);
    const width = parseInt(dimensionsMatch[2]);
    const squareFootage = length * width;
    
    // Update current room
    if (state.currentRoomIndex >= 0) {
      state.rooms[state.currentRoomIndex].dimensions = {
        length,
        width,
        squareFootage
      };
    }
    
    state.stage = ConversationStage.BUDGET;
    
    return `Got it! A ${length}' x ${width}' room (${squareFootage} sq ft). What's your budget range for this project? (e.g., $5,000-$10,000)`;
  } else if (squareFootageMatch) {
    const squareFootage = parseInt(squareFootageMatch[1]);
    
    // Update current room
    if (state.currentRoomIndex >= 0) {
      state.rooms[state.currentRoomIndex].dimensions = {
        squareFootage
      };
    }
    
    state.stage = ConversationStage.BUDGET;
    
    return `Got it! A ${squareFootage} sq ft room. What's your budget range for this project? (e.g., $5,000-$10,000)`;
  } else {
    return "I need the dimensions to calculate costs accurately. Please provide the length and width (e.g., 10x12 feet) or the total square footage (e.g., 120 sq ft).";
  }
}

/**
 * Handle budget stage
 */
function handleBudget(state: ConversationState, userMessage: string): string {
  const budgetRegex = /\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\s*-\s*|\s*to\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)/i;
  const singleBudgetRegex = /\$?(\d{1,3}(?:,\d{3})*|\d+)/i;
  
  const budgetMatch = userMessage.match(budgetRegex);
  const singleBudgetMatch = userMessage.match(singleBudgetRegex);
  
  if (budgetMatch) {
    const min = parseInt(budgetMatch[1].replace(/,/g, ''));
    const max = parseInt(budgetMatch[2].replace(/,/g, ''));
    
    state.budget = { min, max };
    state.stage = ConversationStage.DESIGN_PREFERENCES;
    
    return `A budget of $${min.toLocaleString()}-$${max.toLocaleString()} works for this project. What design style are you interested in? (e.g., modern, traditional, farmhouse, etc.)`;
  } else if (singleBudgetMatch) {
    const budget = parseInt(singleBudgetMatch[1].replace(/,/g, ''));
    
    state.budget = { 
      min: Math.floor(budget * 0.8), 
      max: Math.ceil(budget * 1.2) 
    };
    
    state.stage = ConversationStage.DESIGN_PREFERENCES;
    
    return `A budget of around $${budget.toLocaleString()} works for this project. I'll consider a range of $${state.budget.min.toLocaleString()}-$${state.budget.max.toLocaleString()}. What design style are you interested in? (e.g., modern, traditional, farmhouse, etc.)`;
  } else {
    return "I need a budget range to provide accurate recommendations. Please provide a budget range (e.g., $5,000-$10,000) or a target budget.";
  }
}

/**
 * Handle design preferences stage
 */
function handleDesignPreferences(state: ConversationState, userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect design style
  let designStyle: DesignStyle | null = null;
  
  if (lowerMessage.includes('modern')) {
    designStyle = DesignStyle.MODERN;
  } else if (lowerMessage.includes('traditional')) {
    designStyle = DesignStyle.TRADITIONAL;
  } else if (lowerMessage.includes('contemporary')) {
    designStyle = DesignStyle.CONTEMPORARY;
  } else if (lowerMessage.includes('farmhouse')) {
    designStyle = DesignStyle.FARMHOUSE;
  } else if (lowerMessage.includes('industrial')) {
    designStyle = DesignStyle.INDUSTRIAL;
  } else if (lowerMessage.includes('minimalist')) {
    designStyle = DesignStyle.MINIMALIST;
  } else if (lowerMessage.includes('rustic')) {
    designStyle = DesignStyle.RUSTIC;
  } else if (lowerMessage.includes('transitional')) {
    designStyle = DesignStyle.TRANSITIONAL;
  }
  
  if (designStyle) {
    state.preferences.designStyle = designStyle;
    state.stage = ConversationStage.PRODUCT_SUGGESTIONS;
    
    // Extract color preferences
    const colorRegex = /(white|black|gray|blue|green|red|yellow|brown|beige|cream|navy|teal|purple|pink|orange)/gi;
    const colorMatches = userMessage.match(colorRegex);
    
    if (colorMatches) {
      state.preferences.colorPreferences = Array.from(new Set(colorMatches.map(c => c.toLowerCase())));
    }
    
    // Extract material preferences
    const materialRegex = /(wood|marble|granite|quartz|tile|ceramic|porcelain|glass|metal|steel|brass|copper|concrete|laminate|vinyl)/gi;
    const materialMatches = userMessage.match(materialRegex);
    
    if (materialMatches) {
      state.preferences.materialPreferences = Array.from(new Set(materialMatches.map(m => m.toLowerCase())));
    }
    
    return `I love ${designStyle} style! Based on your preferences, here are some product recommendations for your ${state.rooms[state.currentRoomIndex].type}:\n\n1. Home Depot Shaker Cabinets - $2,500\n   Classic shaker style cabinets in white finish\n\n2. Quartz Countertop - $3,200\n   Durable quartz countertop in marble look\n\n3. Luxury Vinyl Plank Flooring - $1,800\n   Waterproof vinyl planks with wood appearance\n\nWould you like to add any of these to your estimate?`;
  } else {
    return "I need to know your design style to recommend products. Please specify a style like modern, traditional, farmhouse, industrial, etc.";
  }
}

/**
 * Handle product suggestions stage
 */
function handleProductSuggestions(state: ConversationState, userMessage: string): string {
  // Mock product suggestions
  state.productSuggestions = [
    {
      id: '1',
      name: 'Shaker Cabinets',
      brand: 'Home Depot',
      category: 'cabinets',
      price: 2500,
      description: 'Classic shaker style cabinets in white finish'
    },
    {
      id: '2',
      name: 'Quartz Countertop',
      brand: 'Home Depot',
      category: 'countertops',
      price: 3200,
      description: 'Durable quartz countertop in marble look'
    },
    {
      id: '3',
      name: 'Luxury Vinyl Plank Flooring',
      brand: 'Home Depot',
      category: 'flooring',
      price: 1800,
      description: 'Waterproof vinyl planks with wood appearance'
    }
  ];
  
  state.stage = ConversationStage.SUMMARY;
  
  // Generate summary
  let summary = `Here's a summary of your ${state.rooms[state.currentRoomIndex].type} remodel:\n\n`;
  
  // Room details
  const room = state.rooms[state.currentRoomIndex];
  if (room.dimensions?.length && room.dimensions?.width) {
    summary += `Dimensions: ${room.dimensions.length}' x ${room.dimensions.width}' (${room.dimensions.squareFootage} sq ft)\n`;
  } else if (room.dimensions?.squareFootage) {
    summary += `Size: ${room.dimensions.squareFootage} sq ft\n`;
  }
  
  // Budget
  if (state.budget) {
    summary += `Budget: $${state.budget.min.toLocaleString()} - $${state.budget.max.toLocaleString()}\n`;
  }
  
  // Design preferences
  if (state.preferences.designStyle) {
    summary += `Style: ${state.preferences.designStyle}\n`;
  }
  
  if (state.preferences.colorPreferences?.length) {
    summary += `Color preferences: ${state.preferences.colorPreferences.join(', ')}\n`;
  }
  
  if (state.preferences.materialPreferences?.length) {
    summary += `Material preferences: ${state.preferences.materialPreferences.join(', ')}\n`;
  }
  
  // Products
  summary += `\nRecommended Products:\n`;
  let totalProductCost = 0;
  
  state.productSuggestions.forEach(product => {
    summary += `- ${product.name}: $${product.price.toLocaleString()}\n`;
    totalProductCost += product.price;
  });
  
  // Labor costs (mock calculation)
  const squareFootage = room.dimensions?.squareFootage || 100;
  const laborCost = squareFootage * 150; // $150 per square foot as a rough estimate
  
  summary += `\nEstimated Labor: $${laborCost.toLocaleString()}\n`;
  
  // Total
  const totalCost = totalProductCost + laborCost;
  summary += `\nTotal Estimate: $${totalCost.toLocaleString()}\n`;
  
  summary += `\nWould you like to save this estimate to your account?`;
  
  return summary;
}

/**
 * Handle summary stage
 */
function handleSummary(state: ConversationState, userMessage: string): string {
  return "Your estimate is complete! You can save it to your account or make changes if needed.";
}

/**
 * Save project to Supabase
 */
export async function saveProjectToSupabase(
  state: ConversationState,
  userId: string
): Promise<string | null> {
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
}
