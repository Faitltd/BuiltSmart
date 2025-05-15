import axios from 'axios';
import dotenv from 'dotenv';
import { IEstimate, Estimate } from '../database/mongodb/schemas';
import { searchProducts, getRecommendedProducts } from './productService';
import mongoose from 'mongoose';
import pool from '../database/postgres/connection';

dotenv.config();

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-3.5-turbo';

interface LLMResponse {
  message: string;
  structuredData?: any;
  suggestedActions?: string[];
  updatedEstimate?: boolean;
}

// Action types that the LLM can suggest
enum ActionType {
  SEARCH_PRODUCTS = 'search_products',
  ADD_ROOM = 'add_room',
  ADD_LABOR = 'add_labor',
  ADD_PRODUCT = 'add_product',
  SHOW_COST_DATA = 'show_cost_data',
  REQUEST_PHOTO = 'request_photo'
}

interface Action {
  type: ActionType;
  params: any;
}

// Create system prompt based on estimate context
const createSystemPrompt = (estimate: IEstimate): string => {
  const roomNames = estimate.rooms.map(r => r.name).join(', ');
  const totalAmount = estimate.totals.grand_total.toFixed(2);

  return `You are BuildSmart by FAIT, an estimate builder assistant for home improvement projects.
Your goal is to help homeowners create detailed estimates for their remodeling projects.

CURRENT PROJECT STATUS:
- Project scope: ${roomNames ? `Remodeling of ${roomNames}` : "Not defined yet"}
- Rooms included: ${roomNames || "None selected yet"}
- Current total: $${totalAmount}

IMPORTANT GUIDELINES:
- Labor costs are FIXED based on square footage and trade type
- Only product selections will change the estimate price
- Ask for room dimensions to calculate labor costs accurately
- Request photos when helpful for accuracy
- Present good/better/best product options when appropriate
- Remember user preferences throughout the conversation

AVAILABLE ACTIONS:
You can suggest actions by including JSON in your response like this:
\`\`\`json
{
  "action": "search_products",
  "params": {
    "query": "bathroom vanity",
    "category": "bathroom",
    "tier": "better"
  }
}
\`\`\`

Available actions:
1. search_products - Search for products to add to the estimate
2. add_room - Add a new room to the estimate
3. add_labor - Add labor costs for a specific trade
4. add_product - Add a product to a room
5. show_cost_data - Show cost data for a specific room type
6. request_photo - Request a photo from the user

Your tone should be helpful, professional, and knowledgeable about home improvement.
Always provide clear explanations about costs and options.`;
};

// Extract JSON actions from LLM response
const extractActions = (response: string): Action[] => {
  const actions: Action[] = [];
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;

  let match;
  while ((match = jsonRegex.exec(response)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const actionData = JSON.parse(jsonStr);

      if (actionData.action && Object.values(ActionType).includes(actionData.action)) {
        actions.push({
          type: actionData.action as ActionType,
          params: actionData.params || {}
        });
      }
    } catch (error) {
      console.error('Error parsing JSON action:', error);
    }
  }

  return actions;
};

// Process conversation with LLM
export const processLLMConversation = async (
  estimate: IEstimate,
  userMessage: string
): Promise<LLMResponse> => {
  try {
    // Create conversation history for context
    const conversationHistory = estimate.conversation_history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system message at the beginning
    const messages = [
      { role: 'system', content: createSystemPrompt(estimate) },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Call LLM API
    const response = await axios.post(
      LLM_API_URL,
      {
        model: LLM_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM_API_KEY}`
        }
      }
    );

    // Extract response
    const llmResponse = response.data.choices[0].message.content;

    // Extract actions from the response
    const actions = extractActions(llmResponse);

    // Process actions
    let updatedEstimate = false;
    let structuredData = null;

    if (actions.length > 0) {
      // Process the first action (for simplicity)
      const action = actions[0];

      switch (action.type) {
        case ActionType.SEARCH_PRODUCTS:
          const { query, category, tier } = action.params;
          const products = await searchProducts(query, undefined, category, tier);
          structuredData = { products };
          break;

        case ActionType.ADD_ROOM:
          // This would be implemented to add a room to the estimate
          // For now, just mark that we would update the estimate
          updatedEstimate = true;
          break;

        // Other action types would be implemented similarly
      }
    }

    // Clean up the response by removing JSON blocks
    const cleanResponse = llmResponse.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();

    return {
      message: cleanResponse,
      structuredData,
      suggestedActions: actions.map(a => a.type),
      updatedEstimate
    };
  } catch (error) {
    console.error('Error processing LLM conversation:', error);
    return {
      message: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    };
  }
};

// Extract structured data from LLM response
export const extractStructuredData = (response: string): any => {
  // Try to extract JSON from the response
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = response.match(jsonRegex);

  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (error) {
      console.error('Error parsing JSON from response:', error);
    }
  }

  return {
    type: 'unknown',
    data: {}
  };
};

// Helper function to add a room to an estimate
export const addRoomToEstimate = async (
  estimateId: string,
  roomData: {
    name: string;
    type: string;
    dimensions: {
      length: number;
      width: number;
      height?: number;
    }
  }
) => {
  try {
    const { name, type, dimensions } = roomData;
    const area = dimensions.length * dimensions.width;

    // Create new room object
    const newRoom = {
      _id: new mongoose.Types.ObjectId(),
      name,
      type,
      dimensions: {
        ...dimensions,
        area
      },
      labor_items: [],
      product_items: [],
      photos: []
    };

    // Add room to estimate
    await Estimate.findByIdAndUpdate(
      estimateId,
      {
        $push: { rooms: newRoom },
        updated_at: new Date()
      }
    );

    return newRoom;
  } catch (error) {
    console.error('Error adding room to estimate:', error);
    throw error;
  }
};

// Helper function to add a product to a room
export const addProductToRoom = async (
  estimateId: string,
  roomId: string,
  productData: {
    product_id?: string;
    category_id: number;
    name: string;
    price: number;
    quantity: number;
    description?: string;
    source?: string;
    url?: string;
    image_url?: string;
  }
) => {
  try {
    const {
      product_id,
      category_id,
      name,
      price,
      quantity,
      description,
      source,
      url,
      image_url
    } = productData;

    // Get category name
    const categoryResult = await pool.query(
      'SELECT name FROM product_categories WHERE id = $1',
      [category_id]
    );

    const category_name = categoryResult.rows.length > 0
      ? categoryResult.rows[0].name
      : 'Unknown Category';

    // Create new product item
    const newProductItem = {
      _id: new mongoose.Types.ObjectId(),
      product_id,
      category_id,
      category_name,
      name,
      description,
      price,
      quantity,
      total: price * quantity,
      source,
      url,
      image_url
    };

    // Add product to room
    await Estimate.updateOne(
      { _id: estimateId, 'rooms._id': roomId },
      {
        $push: { 'rooms.$.product_items': newProductItem },
        updated_at: new Date()
      }
    );

    return newProductItem;
  } catch (error) {
    console.error('Error adding product to room:', error);
    throw error;
  }
};
