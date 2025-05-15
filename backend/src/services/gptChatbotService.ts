import { openai } from '../config/openai';
import { ConversationStage, RoomType, DesignStyle, ProductCategory } from '../../types/conversation';
import { searchHomeDepotProducts } from '../mocks/homeDepotProducts';
import { sendEstimateEmail, formatEstimateForEmail } from './emailService';

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

// Function to generate system prompt based on conversation stage
const generateSystemPrompt = (state: ConversationState): string => {
  const basePrompt = `# Comprehensive LLM Prompt for FAIT Estimate Builder

## System Instructions

You are the FAIT Estimate Builder, an intelligent voice and text assistant that helps homeowners create detailed renovation estimates. You guide conversations to collect necessary information, show product options, and build estimates in real-time. You are friendly, efficient, and knowledgeable about home renovation.

# CORE RESPONSIBILITIES
- Guide users through a structured estimating process while feeling conversational
- Regularly summarize decisions and progress
- Share complete, properly formatted URLs for product selections
- Keep the conversation focused on completing the estimate
- Handle both voice and text interactions naturally

# COMPANY CONTEXT
FAIT is a co-op that connects homeowners with contractors. The estimate builder helps homeowners plan projects by creating detailed, accurate estimates based on square footage, labor rates, and product selections.

## Conversational Structure

# CONVERSATION FLOW
Follow this general sequence while remaining flexible:
1. Introduction and project scope identification
2. Room selection and prioritization
3. For each room:
   a. Collect dimensions and calculate square footage
   b. Define scope of work (what's being renovated)
   c. Request photos when helpful
   d. Calculate fixed labor costs based on square footage
   e. Present product options (good/better/best)
   f. Allow product searches or URL submissions
   g. Finalize selections for the room
4. Summarize the complete estimate
5. Allow adjustments to any selections

# SUMMARIZATION REQUIREMENTS
- After completing each room, provide a concise summary
- After each major product selection, update the running total
- When transitioning between rooms, summarize what's been completed
- Use a standardized format for all summaries:

"FAIT ESTIMATE SUMMARY:
- Room: [room name] - [dimensions] sq ft
- Scope: [brief description]
- Labor: $[amount]
- Products: $[amount]
- Room Total: $[amount]
- Current Project Total: $[amount]"

## Product and URL Handling

# URL HANDLING
- When sharing product URLs, always use complete URLs starting with http:// or https://
- Format: https://www.homedepot.com/p/[product-id]
- Never abbreviate URLs or remove the domain
- When a user shares a URL, confirm receipt and extract the product details
- If a URL is incomplete, ask for the full URL

# PRODUCT SELECTION
- Present exactly three options for each product category (good/better/best)
- Include price, brief description, and complete URL for each
- Allow users to search for alternatives with natural language
- When presenting options in voice mode, describe them briefly and mention they're visible on screen

## Voice-Specific Instructions

# VOICE INTERACTION GUIDELINES
- Keep voice responses concise (under 15 seconds when possible)
- Use confirmation questions for critical information (dimensions, selections)
- Provide numeric feedback: "Got it - 12 feet by 15 feet gives us 180 square feet"
- When handling ambiguity, offer limited choices rather than open-ended questions
- Signal transitions clearly: "Now let's move on to selecting countertops"
- Always confirm before finalizing major decisions

# MULTI-MODAL AWARENESS
- Acknowledge when information is displayed on screen: "I've sent three options to your screen"
- Provide verbal descriptions of visual elements when in voice-only mode
- Use brevity codes for voice: "Option 1, 2, or 3?" instead of repeating full descriptions

## Progress Tracking and Recovery

# TRACKING & RECOVERY
- Maintain an internal state tracker of the estimate progress
- If the conversation goes off-topic, gently guide it back to the next step
- If information is missing, prompt for it: "Before we continue, I need the dimensions of your bathroom"
- If the user seems confused, offer a summary of progress and clear next steps
- Handle interruptions gracefully and resume from the appropriate point

# ESTIMATE STATE TRACKING
Maintain this information throughout the conversation:
- Project scope: [List of rooms included]
- Current room: [Room being discussed]
- Completed rooms: [Rooms with completed estimates]
- Labor total: $[amount]
- Product total: $[amount]
- Grand total: $[amount]`;

  // Add stage-specific instructions
  switch (state.stage) {
    case ConversationStage.GREETING:
      return `${basePrompt}

You are currently in the GREETING stage. Start by greeting the user and asking which rooms they're planning to remodel.
Examples include: kitchen, bathroom, living room, etc.`;

    case ConversationStage.ROOM_SELECTION:
      return `${basePrompt}

You are currently in the ROOM_SELECTION stage. The user is selecting rooms to remodel. Help them specify which rooms they want to include in their project.
After they've selected rooms, ask for the dimensions of the first room.`;

    case ConversationStage.ROOM_DIMENSIONS:
      return `${basePrompt}

You are currently in the ROOM_DIMENSIONS stage. The user is providing dimensions for their ${state.rooms[state.currentRoomIndex]?.type || 'room'}.
Ask for length and width (e.g., "10 feet by 12 feet") or total square footage.
If they've provided dimensions for all rooms, ask about their budget.`;

    case ConversationStage.BUDGET:
      return `${basePrompt}

You are currently in the BUDGET stage. The user is providing their budget information. Help them specify a budget range.
After they've provided a budget, ask about their design preferences and style.`;

    case ConversationStage.DESIGN_PREFERENCES:
      return `${basePrompt}

You are currently in the DESIGN_PREFERENCES stage. The user is sharing their design preferences. Ask about their preferred style (modern, traditional, farmhouse, etc.)
and any specific features or materials they're interested in.
After they've shared preferences, suggest product categories based on their rooms.`;

    case ConversationStage.PRODUCT_SUGGESTIONS:
      return `${basePrompt}

You are currently in the PRODUCT_SUGGESTIONS stage. The user is exploring product options. Suggest products from Home Depot that match their style and budget.
Present options in a clear format with prices and descriptions.
After showing products, ask if they want to see more options or get a project summary.`;

    case ConversationStage.SUMMARY:
      return `${basePrompt}

You are currently in the SUMMARY stage. Provide a summary of the user's project including:
- Rooms and their dimensions
- Budget range
- Design style
- Suggested products
Ask if they want to add more rooms, explore different products, or get a cost estimate.`;

    default:
      return basePrompt;
  }
};

// Function to format conversation history for OpenAI
const formatConversationHistory = (
  state: ConversationState,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  // Create system message with current state information
  const systemMessage = {
    role: 'system' as const,
    content: generateSystemPrompt(state),
  };

  // Add state information as a system message
  const stateInfo = {
    role: 'system' as const,
    content: `# CURRENT ESTIMATE STATE:

## Project Information:
- Stage: ${state.stage}
- Project scope: ${state.rooms.map(r => r.type).join(', ')}
- Current room: ${state.currentRoomIndex >= 0 && state.currentRoomIndex < state.rooms.length ? state.rooms[state.currentRoomIndex].type : 'None'}
- Completed rooms: ${state.rooms.filter((r, i) => i < state.currentRoomIndex).map(r => r.type).join(', ') || 'None'}

## Budget Information:
- Budget range: ${state.budget ? `$${state.budget.min.toLocaleString()} - $${state.budget.max.toLocaleString()}` : 'Not specified'}

## Design Preferences:
- Design style: ${state.preferences.designStyle || 'Not specified'}
- Color preferences: ${state.preferences.colorPreferences?.join(', ') || 'Not specified'}
- Material preferences: ${state.preferences.materialPreferences?.join(', ') || 'Not specified'}
- Brand preferences: ${state.preferences.brandPreferences?.join(', ') || 'Not specified'}
- Priority features: ${state.preferences.priorityFeatures?.join(', ') || 'Not specified'}

## Room Details:
${state.rooms.map((room, index) => `
Room ${index + 1}: ${room.type}
- Dimensions: ${room.dimensions ?
  `${room.dimensions.length || 0}' x ${room.dimensions.width || 0}' = ${room.dimensions.squareFootage || (room.dimensions.length && room.dimensions.width ? room.dimensions.length * room.dimensions.width : 0)} sq ft` :
  'Not specified'}
- Products: ${room.products?.join(', ') || 'None selected'}
`).join('\n')}

## Product Suggestions:
- Total suggestions: ${state.productSuggestions?.length || 0}`,
  };

  // Format chat history
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Combine system message, state info, and chat history
  return [systemMessage, stateInfo, ...formattedHistory];
};

// Main function to generate response using GPT
export const generateGptResponse = async (
  state: ConversationState,
  userInput: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
): Promise<{ response: string; updatedState: ConversationState }> => {
  try {
    // Create a copy of the state to modify
    const updatedState = JSON.parse(JSON.stringify(state));

    // Format conversation for OpenAI
    const messages = formatConversationHistory(state, [
      ...chatHistory,
      { role: 'user', content: userInput },
    ]);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      function_call: 'auto',
      functions: [
        {
          name: 'updateConversationState',
          description: 'Update the conversation state based on user input',
          parameters: {
            type: 'object',
            properties: {
              stage: {
                type: 'string',
                enum: Object.values(ConversationStage),
                description: 'The new conversation stage',
              },
              detectedRooms: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Rooms detected in user input',
              },
              dimensions: {
                type: 'object',
                properties: {
                  length: { type: 'number' },
                  width: { type: 'number' },
                  squareFootage: { type: 'number' },
                  ceilingHeight: { type: 'number' },
                },
                description: 'Room dimensions detected in user input',
              },
              budget: {
                type: 'object',
                properties: {
                  min: { type: 'number' },
                  max: { type: 'number' },
                },
                description: 'Budget range detected in user input',
              },
              designPreferences: {
                type: 'object',
                properties: {
                  designStyle: { type: 'string' },
                  colorPreferences: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  materialPreferences: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  brandPreferences: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  priorityFeatures: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                },
                description: 'Design preferences detected in user input',
              },
              productCategories: {
                type: 'array',
                items: { type: 'string' },
                description: 'Product categories mentioned by the user',
              },
              productSelections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    name: { type: 'string' },
                    price: { type: 'number' },
                    url: { type: 'string' },
                    description: { type: 'string' },
                  }
                },
                description: 'Products selected by the user',
              },
              emailAddress: {
                type: 'string',
                description: 'Email address provided by the user for sending the estimate',
              },
            },
            required: [],
          },
        },
      ],
    });

    // Get the response text
    const responseText = completion.choices[0].message.content || '';

    // Check if there's a function call
    if (completion.choices[0].message.function_call) {
      const functionCall = completion.choices[0].message.function_call;

      if (functionCall.name === 'updateConversationState') {
        const args = JSON.parse(functionCall.arguments || '{}');

        // Update state based on function call arguments
        if (args.stage) {
          updatedState.stage = args.stage;
        }

        if (args.detectedRooms && args.detectedRooms.length > 0) {
          // Add detected rooms to state
          args.detectedRooms.forEach((roomType: string) => {
            if (!updatedState.rooms.some(r => r.type === roomType)) {
              updatedState.rooms.push({
                type: roomType,
                // Add default product categories based on room type
                products: getProductCategoriesForRoom(roomType),
              });
            }
          });

          // Set current room index if it's not set
          if (updatedState.currentRoomIndex < 0 && updatedState.rooms.length > 0) {
            updatedState.currentRoomIndex = 0;
          }
        }

        if (args.dimensions) {
          // Update dimensions for current room
          if (updatedState.currentRoomIndex >= 0 && updatedState.currentRoomIndex < updatedState.rooms.length) {
            updatedState.rooms[updatedState.currentRoomIndex].dimensions = args.dimensions;

            // Move to next room if there are more rooms
            if (updatedState.currentRoomIndex < updatedState.rooms.length - 1 &&
                args.stage !== ConversationStage.BUDGET) {
              updatedState.currentRoomIndex++;
            } else if (args.stage === ConversationStage.BUDGET) {
              // Move to budget stage if specified
              updatedState.stage = ConversationStage.BUDGET;
            }
          }
        }

        if (args.budget) {
          // Update budget
          updatedState.budget = args.budget;

          // Move to design preferences stage if specified
          if (args.stage === ConversationStage.DESIGN_PREFERENCES) {
            updatedState.stage = ConversationStage.DESIGN_PREFERENCES;
          }
        }

        if (args.designPreferences) {
          // Update design preferences
          if (args.designPreferences.designStyle) {
            updatedState.preferences.designStyle = args.designPreferences.designStyle;
          }

          if (args.designPreferences.colorPreferences) {
            updatedState.preferences.colorPreferences = args.designPreferences.colorPreferences;
          }

          if (args.designPreferences.materialPreferences) {
            updatedState.preferences.materialPreferences = args.designPreferences.materialPreferences;
          }

          if (args.designPreferences.brandPreferences) {
            updatedState.preferences.brandPreferences = args.designPreferences.brandPreferences;
          }

          if (args.designPreferences.priorityFeatures) {
            updatedState.preferences.priorityFeatures = args.designPreferences.priorityFeatures;
          }

          // Move to product suggestions stage if specified
          if (args.stage === ConversationStage.PRODUCT_SUGGESTIONS) {
            updatedState.stage = ConversationStage.PRODUCT_SUGGESTIONS;
          }
        }

        if (args.productCategories && args.productCategories.length > 0) {
          // Update product categories for current room
          if (updatedState.currentRoomIndex >= 0 && updatedState.currentRoomIndex < updatedState.rooms.length) {
            updatedState.rooms[updatedState.currentRoomIndex].products = args.productCategories;
          }
        }

        if (args.productSelections && args.productSelections.length > 0) {
          // Store product selections in state
          const products = args.productSelections.map((product: any) => ({
            id: Math.random().toString(36).substring(2, 15),
            name: product.name,
            category: product.category,
            price: product.price,
            description: product.description,
            url: product.url,
            roomType: updatedState.rooms[updatedState.currentRoomIndex]?.type,
            designStyle: updatedState.preferences.designStyle,
          }));

          // Add to existing product suggestions or create new array
          if (updatedState.productSuggestions) {
            updatedState.productSuggestions = [...updatedState.productSuggestions, ...products];
          } else {
            updatedState.productSuggestions = products;
          }

          // Move to summary stage if specified
          if (args.stage === ConversationStage.SUMMARY) {
            updatedState.stage = ConversationStage.SUMMARY;
          }
        }

        // Handle email address for sending the estimate
        if (args.emailAddress) {
          console.log(`Email address provided: ${args.emailAddress}`);

          try {
            // Format the estimate for email
            const emailContent = formatEstimateForEmail(updatedState);

            // Send the estimate email
            sendEstimateEmail(args.emailAddress, updatedState)
              .then(result => {
                console.log(result);
              })
              .catch(error => {
                console.error('Error sending estimate email:', error);
              });
          } catch (error) {
            console.error('Error preparing estimate email:', error);
          }
        }
      }
    }

    return { response: responseText, updatedState };
  } catch (error) {
    console.error('Error generating GPT response:', error);
    return {
      response: "I'm sorry, I'm having trouble processing your request right now. Could you please try again?",
      updatedState: state,
    };
  }
};

// Helper function to get product categories for a room type
const getProductCategoriesForRoom = (roomType: string): ProductCategory[] => {
  switch (roomType.toLowerCase()) {
    case 'kitchen':
      return [ProductCategory.CABINETS, ProductCategory.COUNTERTOPS, ProductCategory.APPLIANCES, ProductCategory.FLOORING, ProductCategory.LIGHTING, ProductCategory.FIXTURES];
    case 'bathroom':
    case 'master bathroom':
      return [ProductCategory.CABINETS, ProductCategory.COUNTERTOPS, ProductCategory.FIXTURES, ProductCategory.TILE, ProductCategory.LIGHTING];
    case 'bedroom':
      return [ProductCategory.FLOORING, ProductCategory.PAINT, ProductCategory.LIGHTING, ProductCategory.DOORS];
    case 'living room':
      return [ProductCategory.FLOORING, ProductCategory.PAINT, ProductCategory.LIGHTING, ProductCategory.WINDOWS];
    case 'dining room':
      return [ProductCategory.FLOORING, ProductCategory.PAINT, ProductCategory.LIGHTING];
    case 'basement':
      return [ProductCategory.FLOORING, ProductCategory.PAINT, ProductCategory.LIGHTING, ProductCategory.DOORS, ProductCategory.WINDOWS];
    default:
      return [ProductCategory.FLOORING, ProductCategory.PAINT];
  }
};
