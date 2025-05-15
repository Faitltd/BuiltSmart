/**
 * Conversation flow logic for the BuildSmart remodeling chatbot
 * Guides users through a structured conversation to gather information for estimates
 */

// Conversation stages
export enum ConversationStage {
  GREETING = 'greeting',
  ROOM_SELECTION = 'room_selection',
  ROOM_DIMENSIONS = 'room_dimensions',
  BUDGET = 'budget',
  DESIGN_PREFERENCES = 'design_preferences',
  PRODUCT_SUGGESTIONS = 'product_suggestions',
  SUMMARY = 'summary'
}

// Room types supported by the system
export enum RoomType {
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  MASTER_BATHROOM = 'master bathroom',
  BEDROOM = 'bedroom',
  LIVING_ROOM = 'living room',
  DINING_ROOM = 'dining room',
  BASEMENT = 'basement',
  OTHER = 'other'
}

// Design styles
export enum DesignStyle {
  MODERN = 'modern',
  TRADITIONAL = 'traditional',
  CONTEMPORARY = 'contemporary',
  FARMHOUSE = 'farmhouse',
  MINIMALIST = 'minimalist',
  INDUSTRIAL = 'industrial',
  RUSTIC = 'rustic',
  TRANSITIONAL = 'transitional',
  OTHER = 'other'
}

// Product categories
export enum ProductCategory {
  FLOORING = 'flooring',
  CABINETS = 'cabinets',
  COUNTERTOPS = 'countertops',
  FIXTURES = 'fixtures',
  APPLIANCES = 'appliances',
  LIGHTING = 'lighting',
  TILE = 'tile',
  PAINT = 'paint',
  DOORS = 'doors',
  WINDOWS = 'windows'
}

// Room dimensions
export interface RoomDimensions {
  length?: number;
  width?: number;
  squareFootage?: number;
  ceilingHeight?: number;
}

// User preferences
export interface UserPreferences {
  designStyle?: DesignStyle;
  colorPreferences?: string[];
  materialPreferences?: string[];
  brandPreferences?: string[];
  priorityFeatures?: string[];
}

// Room information
export interface RoomInfo {
  type: RoomType;
  dimensions?: RoomDimensions;
  products?: ProductCategory[];
}

// Conversation state
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

// Initialize a new conversation state
export const initializeConversation = (): ConversationState => {
  return {
    stage: ConversationStage.GREETING,
    rooms: [],
    currentRoomIndex: -1,
    preferences: {}
  };
};

// Room type detection from user input
export const detectRoomTypes = (input: string): RoomType[] => {
  const lowerInput = input.toLowerCase();
  const rooms: RoomType[] = [];
  
  if (lowerInput.includes('kitchen')) {
    rooms.push(RoomType.KITCHEN);
  }
  
  if (lowerInput.includes('master bathroom') || lowerInput.includes('master bath')) {
    rooms.push(RoomType.MASTER_BATHROOM);
  } else if (lowerInput.includes('bathroom') || lowerInput.includes('bath')) {
    rooms.push(RoomType.BATHROOM);
  }
  
  if (lowerInput.includes('bedroom')) {
    rooms.push(RoomType.BEDROOM);
  }
  
  if (lowerInput.includes('living room') || lowerInput.includes('living area')) {
    rooms.push(RoomType.LIVING_ROOM);
  }
  
  if (lowerInput.includes('dining room') || lowerInput.includes('dining area')) {
    rooms.push(RoomType.DINING_ROOM);
  }
  
  if (lowerInput.includes('basement')) {
    rooms.push(RoomType.BASEMENT);
  }
  
  return rooms;
};

// Extract dimensions from user input
export const extractDimensions = (input: string): RoomDimensions | null => {
  const dimensions: RoomDimensions = {};
  
  // Look for "X by Y" or "X x Y" patterns
  const dimensionRegex = /(\d+(?:\.\d+)?)\s*(?:x|by|×)\s*(\d+(?:\.\d+)?)/i;
  const match = input.match(dimensionRegex);
  
  if (match) {
    dimensions.length = parseFloat(match[1]);
    dimensions.width = parseFloat(match[2]);
    dimensions.squareFootage = dimensions.length * dimensions.width;
    return dimensions;
  }
  
  // Look for square footage
  const sqftRegex = /(\d+(?:\.\d+)?)\s*(?:square feet|sq ft|sqft|sq\. ft\.)/i;
  const sqftMatch = input.match(sqftRegex);
  
  if (sqftMatch) {
    dimensions.squareFootage = parseFloat(sqftMatch[1]);
    return dimensions;
  }
  
  return null;
};

// Extract budget from user input
export const extractBudget = (input: string): { min: number, max: number } | null => {
  // Look for budget range like "$20,000-$30,000" or "20k to 30k"
  const rangeRegex = /\$?(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:k|thousand)?\s*(?:to|-)\s*\$?(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:k|thousand)?/i;
  const rangeMatch = input.match(rangeRegex);
  
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1].replace(/,/g, ''));
    let max = parseFloat(rangeMatch[2].replace(/,/g, ''));
    
    // Convert k to thousands
    if (rangeMatch[0].toLowerCase().includes('k') || rangeMatch[0].toLowerCase().includes('thousand')) {
      if (!rangeMatch[0].toLowerCase().includes('k', rangeMatch[1].length) && 
          !rangeMatch[0].toLowerCase().includes('thousand', rangeMatch[1].length)) {
        min *= 1000;
      }
      
      if (!rangeMatch[0].toLowerCase().includes('k', rangeMatch[0].indexOf(rangeMatch[2]) + rangeMatch[2].length) && 
          !rangeMatch[0].toLowerCase().includes('thousand', rangeMatch[0].indexOf(rangeMatch[2]) + rangeMatch[2].length)) {
        max *= 1000;
      }
    }
    
    return { min, max };
  }
  
  // Look for single budget like "around $25,000" or "25k" or "under 30k"
  const singleRegex = /(?:around|about|approximately|roughly|under|less than|up to|maximum|max)?\s*\$?(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:k|thousand)?/i;
  const singleMatch = input.match(singleRegex);
  
  if (singleMatch) {
    let value = parseFloat(singleMatch[1].replace(/,/g, ''));
    
    // Convert k to thousands
    if (singleMatch[0].toLowerCase().includes('k') || singleMatch[0].toLowerCase().includes('thousand')) {
      value *= 1000;
    }
    
    if (singleMatch[0].toLowerCase().includes('under') || 
        singleMatch[0].toLowerCase().includes('less than') || 
        singleMatch[0].toLowerCase().includes('up to') || 
        singleMatch[0].toLowerCase().includes('maximum') || 
        singleMatch[0].toLowerCase().includes('max')) {
      return { min: 0, max: value };
    } else {
      // Assume a range of ±20% for "around" estimates
      return { min: value * 0.8, max: value * 1.2 };
    }
  }
  
  return null;
};

// Detect design style from user input
export const detectDesignStyle = (input: string): DesignStyle | null => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('modern')) return DesignStyle.MODERN;
  if (lowerInput.includes('traditional')) return DesignStyle.TRADITIONAL;
  if (lowerInput.includes('contemporary')) return DesignStyle.CONTEMPORARY;
  if (lowerInput.includes('farmhouse')) return DesignStyle.FARMHOUSE;
  if (lowerInput.includes('minimalist')) return DesignStyle.MINIMALIST;
  if (lowerInput.includes('industrial')) return DesignStyle.INDUSTRIAL;
  if (lowerInput.includes('rustic')) return DesignStyle.RUSTIC;
  if (lowerInput.includes('transitional')) return DesignStyle.TRANSITIONAL;
  
  return null;
};

// Get typical product categories for a room type
export const getProductCategoriesForRoom = (roomType: RoomType): ProductCategory[] => {
  switch (roomType) {
    case RoomType.KITCHEN:
      return [
        ProductCategory.CABINETS,
        ProductCategory.COUNTERTOPS,
        ProductCategory.APPLIANCES,
        ProductCategory.FLOORING,
        ProductCategory.LIGHTING,
        ProductCategory.FIXTURES
      ];
    case RoomType.BATHROOM:
    case RoomType.MASTER_BATHROOM:
      return [
        ProductCategory.CABINETS,
        ProductCategory.COUNTERTOPS,
        ProductCategory.FIXTURES,
        ProductCategory.TILE,
        ProductCategory.LIGHTING
      ];
    case RoomType.BEDROOM:
      return [
        ProductCategory.FLOORING,
        ProductCategory.PAINT,
        ProductCategory.LIGHTING,
        ProductCategory.DOORS
      ];
    case RoomType.LIVING_ROOM:
      return [
        ProductCategory.FLOORING,
        ProductCategory.PAINT,
        ProductCategory.LIGHTING,
        ProductCategory.WINDOWS
      ];
    case RoomType.DINING_ROOM:
      return [
        ProductCategory.FLOORING,
        ProductCategory.PAINT,
        ProductCategory.LIGHTING
      ];
    case RoomType.BASEMENT:
      return [
        ProductCategory.FLOORING,
        ProductCategory.PAINT,
        ProductCategory.LIGHTING,
        ProductCategory.DOORS,
        ProductCategory.WINDOWS
      ];
    default:
      return [
        ProductCategory.FLOORING,
        ProductCategory.PAINT
      ];
  }
};
