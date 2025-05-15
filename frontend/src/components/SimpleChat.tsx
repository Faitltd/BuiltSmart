import React, { useState, useRef, useEffect } from 'react';
import { searchProducts } from '../mocks/productData';
import { generateGptResponse } from '../services/gptChatbotService';

// Define Product interface locally to avoid import issues
interface Product {
  id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  brand?: string;
  source?: string;
  url?: string;
  image_url?: string;
  tier?: 'good' | 'better' | 'best';
}

import {
  laborRates,
  hourlyRates,
  fixtureRates,
  calculateLaborCost,
  getTypicalTradesForRoom,
  calculateFixtureCosts
} from '../mocks/laborData';
import { initializeChatbot, generateChatbotResponse, saveProjectToSupabase } from '../utils/chatbotHandler';
import {
  ConversationStage,
  RoomType,
  DesignStyle,
  ProductCategory
} from '../utils/conversationFlow';

// Define RoomDimensions interface locally to avoid import issues
interface RoomDimensions {
  length?: number;
  width?: number;
  squareFootage?: number;
  ceilingHeight?: number;
}

// Define UserPreferences interface locally to avoid import issues
interface UserPreferences {
  designStyle?: DesignStyle;
  colorPreferences?: string[];
  materialPreferences?: string[];
  brandPreferences?: string[];
  priorityFeatures?: string[];
}

// Define RoomInfo interface locally to avoid import issues
interface RoomInfo {
  type: RoomType;
  dimensions?: RoomDimensions;
  products?: ProductCategory[];
}

import { useAuth } from '../contexts/AuthContext';

// Define the ConversationState interface here to avoid import issues
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

// Define HomeDepotProduct interface here to avoid import issues
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SimpleChat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatbotState, setChatbotState] = useState<ConversationState | null>(null);
  const [useNewChatbot, setUseNewChatbot] = useState(false);
  const [useGpt, setUseGpt] = useState(false);
  const [showProductCard, setShowProductCard] = useState<HomeDepotProduct | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuth();

  // Initialize chatbot on component mount
  useEffect(() => {
    const { response, state } = initializeChatbot();
    setChatbotState(state);

    // Add initial greeting to chat history
    setChatHistory([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Mock responses based on user input
  const getMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for hourly labor rates
    if (lowerMessage.includes('hourly') ||
        lowerMessage.includes('hour rate') ||
        lowerMessage.includes('per hour')) {

      let response = "Here are our hourly labor rates for remodeling projects:\n\n";

      hourlyRates.forEach(rate => {
        response += `${rate.name}: $${rate.max_rate.toFixed(2)}/hour\n`;
      });

      response += "\nThese hourly rates are typically used for smaller or custom tasks. We use the highest rates to ensure accurate budgeting.";

      return response;
    }

    // Check for fixture or per-unit labor rates
    if (lowerMessage.includes('fixture') ||
        lowerMessage.includes('per unit') ||
        lowerMessage.includes('per item') ||
        lowerMessage.includes('toilet') ||
        lowerMessage.includes('vanity') ||
        lowerMessage.includes('shower') ||
        lowerMessage.includes('door') ||
        lowerMessage.includes('window') ||
        lowerMessage.includes('can light') ||
        lowerMessage.includes('bath fan')) {

      let response = "Here are our per-fixture labor rates for remodeling projects:\n\n";

      // Group fixtures by category
      const categories = [...new Set(fixtureRates.map(f => f.category))];

      categories.forEach(category => {
        response += `${category}:\n`;

        fixtureRates
          .filter(f => f.category === category)
          .forEach(fixture => {
            response += `- ${fixture.name}: $${fixture.max_rate.toFixed(2)} ${fixture.unit}\n`;
          });

        response += "\n";
      });

      response += "We use the highest rates to ensure accurate budgeting. Would you like to calculate fixture costs for a specific room type?";

      return response;
    }

    // Check for labor cost information (square footage based)
    if (lowerMessage.includes('labor') ||
        lowerMessage.includes('cost per square foot') ||
        lowerMessage.includes('price per square foot') ||
        lowerMessage.includes('labor pricing')) {

      let response = "Here's the labor pricing information for remodeling projects (per square foot):\n\n";

      laborRates.forEach(rate => {
        response += `${rate.name}: $${rate.max_rate.toFixed(2)}/sq ft\n`;
      });

      response += "\nWe use the highest rates to ensure accurate budgeting. These rates are multiplied by the square footage of your room to calculate labor costs. Would you like to calculate labor costs for a specific room?";

      return response;
    }

    // Check for labor calculation request
    const roomSizeRegex = /(\d+)\s*(?:x|by)\s*(\d+)/i;
    const roomSizeMatch = userMessage.match(roomSizeRegex);

    if (roomSizeMatch &&
        (lowerMessage.includes('room') ||
         lowerMessage.includes('kitchen') ||
         lowerMessage.includes('bathroom') ||
         lowerMessage.includes('bedroom') ||
         lowerMessage.includes('living'))) {

      // Extract room dimensions
      const length = parseInt(roomSizeMatch[1]);
      const width = parseInt(roomSizeMatch[2]);
      const area = length * width;

      // Determine room type
      let roomType = 'room';
      if (lowerMessage.includes('kitchen')) roomType = 'kitchen';
      else if (lowerMessage.includes('bathroom')) roomType = 'bathroom';
      else if (lowerMessage.includes('bedroom')) roomType = 'bedroom';
      else if (lowerMessage.includes('living')) roomType = 'living room';

      // Get typical trades for this room type
      const typicalTrades = getTypicalTradesForRoom(roomType);

      // Calculate labor costs (square footage based)
      let totalLaborCost = 0;
      let response = `For a ${length}' x ${width}' ${roomType} (${area} sq ft), here's the estimated cost breakdown:\n\n`;
      response += `SQUARE FOOTAGE BASED LABOR:\n`;

      typicalTrades.forEach(tradeId => {
        const trade = laborRates.find(r => r.id === tradeId);
        if (trade) {
          const cost = calculateLaborCost(tradeId, area);
          totalLaborCost += cost;
          response += `${trade.name}: $${cost.toFixed(2)} ($${trade.max_rate.toFixed(2)}/sq ft)\n`;
        }
      });

      response += `\nSubtotal for square footage labor: $${totalLaborCost.toFixed(2)}\n`;

      // Calculate fixture costs
      const fixtureCosts = calculateFixtureCosts(roomType);

      if (fixtureCosts.items.length > 0) {
        response += `\nFIXTURE BASED LABOR:\n`;

        fixtureCosts.items.forEach(item => {
          response += `${item.name}: $${item.cost.toFixed(2)} ${item.unit}\n`;
        });

        response += `\nSubtotal for fixture labor: $${fixtureCosts.total.toFixed(2)}\n`;
      }

      // Calculate grand total
      const grandTotal = totalLaborCost + fixtureCosts.total;
      response += `\nTOTAL ESTIMATED LABOR COST: $${grandTotal.toFixed(2)}`;
      response += `\n\nThis estimate uses our standard labor rates based on the highest pricing in our database to ensure accurate budgeting.`;

      return response;
    }

    // Check for product search queries
    if (lowerMessage.includes('cabinet') ||
        lowerMessage.includes('countertop') ||
        lowerMessage.includes('vanity') ||
        lowerMessage.includes('bathroom') && lowerMessage.includes('fixture')) {

      // Extract search terms
      let searchTerm = '';
      if (lowerMessage.includes('cabinet')) searchTerm = 'cabinet';
      else if (lowerMessage.includes('countertop')) searchTerm = 'countertop';
      else if (lowerMessage.includes('vanity') ||
              (lowerMessage.includes('bathroom') && lowerMessage.includes('fixture'))) {
        searchTerm = 'bathroom vanity';
      }

      // Search for products
      if (searchTerm) {
        const foundProducts = searchProducts(searchTerm);

        if (foundProducts.length > 0) {
          // Create a response with product recommendations
          let response = `I found some ${searchTerm} options that might work for your project:\n\n`;

          // Add up to 3 products to the response
          foundProducts.slice(0, 3).forEach((product, index) => {
            response += `${index + 1}. ${product.name} - $${product.price}\n`;
            response += `   ${product.description}\n\n`;
          });

          response += `Would you like to add any of these to your estimate? Or would you like to see more options?`;
          return response;
        }
      }
    }

    // Standard responses
    if (chatHistory.length === 0) {
      return "Hi there! I'm BuildSmart by FAIT, your remodeling estimate assistant. I can help you create a detailed estimate for your project. What kind of remodeling are you planning?";
    } else if (lowerMessage.includes('kitchen') && !roomSizeMatch) {
      return "Kitchen remodels are one of our specialties! The average kitchen remodel costs between $25,000 and $40,000 depending on the quality level.\n\nFor labor, we use the highest rates to ensure accurate budgeting:\n\nSQUARE FOOTAGE BASED LABOR:\n- Framing: $3.75/sq ft\n- Drywall: $2.25/sq ft\n- Paint: $1.10/sq ft\n- Flooring: $2.50/sq ft\n- Trim: $2.25/sq ft\n\nPER-FIXTURE LABOR RATES:\n- Can Lights: $125/light\n\nWould you like to add a kitchen to your estimate? I'll need the dimensions to calculate labor costs accurately (e.g., '10x12 kitchen').";
    } else if ((lowerMessage.includes('bathroom') || lowerMessage.includes('bath')) && !roomSizeMatch) {
      return "Bathroom renovations typically range from $10,000 to $30,000 depending on fixtures you choose.\n\nFor labor, we use the highest rates to ensure accurate budgeting:\n\nSQUARE FOOTAGE BASED LABOR:\n- Framing: $3.75/sq ft\n- Drywall: $2.25/sq ft\n- Paint: $1.10/sq ft\n- Tile Labor (Floor): $12.50/sq ft\n- Tile Labor (Shower): $15.00/sq ft\n\nPER-FIXTURE LABOR RATES:\n- Can Lights: $125/light\n- Bath Fan: $200/fan\n- Toilet Install: $250/unit\n- Vanity/Sink Install: $300/unit\n- Tile Shower: $4,500 total\n- Fiberglass Shower/Tub: $1,200/unit\n\nWould you like to add a bathroom to your estimate? What are the approximate dimensions (e.g., '8x10 bathroom')?";
    } else if (lowerMessage.includes('basement')) {
      return "Finishing a basement can add valuable living space to your home.\n\nFor labor, we use the highest rates to ensure accurate budgeting:\n\nSQUARE FOOTAGE BASED LABOR:\n- Framing: $3.75/sq ft\n- Drywall: $2.25/sq ft\n- Paint: $1.10/sq ft\n- Flooring: $2.50/sq ft\n- Insulation: $1.50/sq ft\n\nPER-FIXTURE LABOR RATES:\n- Can Lights: $125/light\n- Interior Door Install: $200/door\n- Egress Window Install: $2,500/window\n\nWhat's the approximate square footage of your basement? Or you can provide dimensions (e.g., '20x30 basement').";
    } else if (lowerMessage.includes('bedroom') && !roomSizeMatch) {
      return "Bedroom remodels typically cost between $5,000 and $15,000 depending on size and features.\n\nFor labor, we use the highest rates to ensure accurate budgeting:\n\nSQUARE FOOTAGE BASED LABOR:\n- Drywall: $2.25/sq ft\n- Paint: $1.10/sq ft\n- Flooring: $2.50/sq ft\n- Trim: $2.25/sq ft\n\nPER-FIXTURE LABOR RATES:\n- Can Lights: $125/light\n- Interior Door Install: $200/door\n\nWhat are the dimensions of the bedroom you're planning to remodel (e.g., '12x14 bedroom')?";
    } else if (lowerMessage.includes('product') || lowerMessage.includes('fixture') || lowerMessage.includes('material')) {
      return "I can help you find products that match your style and budget. What specific items are you looking for? For example, I can suggest options for cabinets, countertops, flooring, fixtures, and appliances.";
    } else if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('how much')) {
      return "I can provide cost estimates for different room types. We have several types of labor pricing:\n\n1. SQUARE FOOTAGE BASED LABOR:\n- Framing: $3.75/sq ft\n- Drywall: $2.25/sq ft\n- Paint: $1.10/sq ft\n- Flooring: $2.50/sq ft\n\n2. HOURLY LABOR RATES:\n- General Labor: $75/hour\n- Specialized Labor (Plumbing, Electrical, HVAC): $120/hour\n\n3. PER-FIXTURE LABOR RATES:\n- Can Lights: $125/light\n- Bath Fan: $200/fan\n- Toilet Install: $250/unit\n- Vanity/Sink Install: $300/unit\n\nWould you like to see our complete labor pricing or calculate costs for a specific room?";
    } else if (lowerMessage.includes('labor') || lowerMessage.includes('trade')) {
      return "Our labor pricing uses the highest rates to ensure accurate budgeting. We have several types of labor pricing:\n\n1. SQUARE FOOTAGE BASED LABOR:\n- Framing: $3.75/sq ft\n- Drywall: $2.25/sq ft\n- Paint: $1.10/sq ft\n- Flooring (LVP/Vinyl): $2.50/sq ft\n- Insulation: $1.50/sq ft\n- Trim Install: $2.25/sq ft\n- Tile Labor (Floor): $12.50/sq ft\n- Tile Labor (Shower): $15.00/sq ft\n- Ceiling Finishing: $2.25/sq ft\n- Paint Touch-up: $1.10/sq ft\n- Two-tone Paint: $1.20/sq ft\n\n2. HOURLY LABOR RATES:\n- General Labor: $75/hour\n- Specialized Labor (Plumbing, Electrical, HVAC): $120/hour\n\n3. PER-FIXTURE LABOR RATES:\n- Can Lights: $125/light\n- Bath Fan: $200/fan\n- Toilet Install: $250/unit\n- Vanity/Sink Install: $300/unit\n- Tile Shower: $4,500 total\n- Fiberglass Shower/Tub: $1,200/unit\n- Interior Door Install: $200/door\n- Egress Window Install: $2,500/window\n\nTo calculate costs for your project, please provide the room dimensions (e.g., '10x12 kitchen').";
    } else {
      return "I'm here to help you build your remodeling estimate. I can add rooms to your estimate, suggest products, calculate costs, and more. You can ask me about:\n\n- Square footage based labor costs\n- Hourly labor rates\n- Per-fixture labor rates\n- Cost estimates for rooms (provide dimensions like '10x12 kitchen')\n- Product recommendations\n- Typical project costs\n\nWhat would you like to know about your project?";
    }
  };

  // Toggle between old, rule-based, and GPT chatbot
  const toggleChatbot = () => {
    if (useNewChatbot && useGpt) {
      // Switch to rule-based chatbot
      setUseGpt(false);
      setUseNewChatbot(true);
    } else if (useNewChatbot && !useGpt) {
      // Switch to old mock chatbot
      setUseNewChatbot(false);
      setUseGpt(false);
    } else {
      // Switch to GPT chatbot
      setUseNewChatbot(true);
      setUseGpt(true);
    }

    // Clear chat history and initialize new chatbot
    const { response, state } = initializeChatbot();
    setChatbotState(state);

    setChatHistory([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Extract product information from message
  const extractProductInfo = (content: string): HomeDepotProduct | null => {
    // Look for product information in the message
    if (content.includes('Home Depot') && content.includes('$')) {
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Look for product name and price pattern
        const productMatch = line.match(/\d+\.\s+(.*?)\s+-\s+\$(\d+\.\d+)/);

        if (productMatch) {
          const productName = productMatch[1];
          const productPrice = parseFloat(productMatch[2]);

          // Find the product in the mock data
          const matchingProducts = searchProducts(productName);

          if (matchingProducts.length > 0) {
            return matchingProducts[0] as unknown as HomeDepotProduct;
          }
        }
      }
    }

    return null;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Reset product card
    setShowProductCard(null);

    // Simulate AI response delay
    setTimeout(async () => {
      let responseContent = '';
      let updatedState = chatbotState;

      if (useNewChatbot) {
        if (useGpt && chatbotState) {
          // Use GPT chatbot
          try {
            // Format chat history for GPT
            const formattedHistory = chatHistory.map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            }));

            // Call GPT service
            const result = await generateGptResponse(
              chatbotState,
              userMessage.content,
              formattedHistory
            );

            responseContent = result.response;
            updatedState = result.updatedState;
            setChatbotState(updatedState);

            // Check if response contains product information
            const productInfo = extractProductInfo(responseContent);
            if (productInfo) {
              setShowProductCard(productInfo);
            }

            // Show save button if we're at the summary stage and user is logged in
            if (updatedState.stage === ConversationStage.SUMMARY && user) {
              setShowSaveButton(true);
            }
          } catch (error) {
            console.error('Error with GPT chatbot:', error);
            responseContent = "I'm sorry, I encountered an error. Please try again.";
          }
        } else {
          // Use the rule-based chatbot handler
          const { response, updatedState: newState } = generateChatbotResponse(chatbotState, userMessage.content);
          responseContent = response;
          updatedState = newState;
          setChatbotState(updatedState);

          // Check if response contains product information
          const productInfo = extractProductInfo(responseContent);
          if (productInfo) {
            setShowProductCard(productInfo);
          }

          // Show save button if we're at the summary stage and user is logged in
          if (updatedState.stage === ConversationStage.SUMMARY && user) {
            setShowSaveButton(true);
          }
        }
      } else {
        // Use the old mock response system
        responseContent = getMockResponse(userMessage.content);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Product card component
  const ProductCard = ({ product }: { product: HomeDepotProduct }) => {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md my-4 max-w-md">
        <div className="bg-orange-600 text-white p-2 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-sm">Home Depot Product</span>
          </div>
          <span className="text-sm text-white opacity-80">{product.brand}</span>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2">{product.name}</h3>
          <div className="flex items-center mb-3">
            <span className="text-xl font-bold text-orange-600">${product.price.toFixed(2)}</span>
            <div className="ml-auto flex items-center">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-sm text-gray-600">({product.reviewCount})</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-100">
            <p className="text-gray-700 text-sm">{product.description}</p>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Features:
            </h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {product.features.slice(0, 3).map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="flex space-x-2">
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-orange-600 text-white text-center py-2 px-4 rounded hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              View on Home Depot
            </a>
            <button
              className="bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors"
              onClick={() => {
                // Add to estimate functionality would go here
                alert('Product added to estimate!');
              }}
            >
              Add to Estimate
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle saving project to Supabase
  const handleSaveProject = async () => {
    if (!user || !chatbotState) return;

    try {
      setIsSaving(true);
      const projectId = await saveProjectToSupabase(chatbotState, user.id);

      if (projectId) {
        setSaveSuccess(true);
        setShowSaveButton(false);

        // Add success message to chat
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Your project has been saved successfully! You can access it anytime from your projects dashboard.`,
          timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, successMessage]);
      }
    } catch (error) {
      console.error('Error saving project:', error);

      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, there was an error saving your project. Please try again later.`,
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
        <h2 className="text-lg font-bold text-primary">BuildSmart by FAIT</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // Format chat history for copying
              const formattedChat = chatHistory.map(msg =>
                `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.role === 'user' ? 'User' : 'BuildSmart'}: ${msg.content}`
              ).join('\n\n');

              // Add debug information if using the structured chatbot
              let debugInfo = '';
              if (useNewChatbot && chatbotState) {
                debugInfo = `\n\n--- DEBUG INFO ---\n`;
                debugInfo += `Stage: ${chatbotState.stage}\n`;
                debugInfo += `Rooms: ${chatbotState.rooms.map(r =>
                  `${r.type} (${r.dimensions ?
                    `${r.dimensions.length || 0}x${r.dimensions.width || 0}, ${r.dimensions.squareFootage || 0} sq ft` :
                    'No dimensions'
                  })`
                ).join(', ')}\n`;
                debugInfo += `Budget: ${chatbotState.budget ?
                  `$${chatbotState.budget.min.toLocaleString()} - $${chatbotState.budget.max.toLocaleString()}` :
                  'Not specified'
                }\n`;
                debugInfo += `Design Style: ${chatbotState.preferences.designStyle || 'Not specified'}\n`;
              }

              // Copy to clipboard
              navigator.clipboard.writeText(formattedChat + debugInfo)
                .then(() => {
                  // Visual feedback that copy succeeded
                  const button = document.getElementById('copy-chat-button');
                  if (button) {
                    button.classList.add('bg-green-500', 'text-white');
                    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg> Copied!`;

                    // Reset after 2 seconds
                    setTimeout(() => {
                      button.classList.remove('bg-green-500', 'text-white');
                      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg> Copy Chat`;
                    }, 2000);
                  }
                })
                .catch(err => {
                  console.error('Failed to copy chat:', err);
                });
            }}
            id="copy-chat-button"
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            Copy Chat
          </button>
          <button
            onClick={toggleChatbot}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            {useGpt ? 'Switch to Rule-Based Bot' : (useNewChatbot ? 'Switch to Labor Cost Bot' : 'Switch to GPT Chatbot')}
          </button>
          {user && (
            <span className="text-sm text-gray-600">
              Signed in as <span className="font-medium">{user.email}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-8 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
              <div className="bg-primary text-white p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-primary">Welcome to BuildSmart by FAIT!</h2>
            </div>
            <p className="text-gray-700 mb-3">I'm your AI assistant to help create your remodeling estimate. Here's how I can help:</p>
            <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-1">
              <li>Tell me about your remodeling project and I'll help build an estimate</li>
              <li>Ask about costs for specific rooms or materials</li>
              <li>Get product recommendations that fit your budget and style</li>
              <li>Add rooms, labor, and products to your estimate</li>
            </ul>
            <p className="text-gray-700 font-medium">Let's get started! What kind of remodeling project are you planning?</p>
          </div>
        ) : (
          <>
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto bg-primary text-white' : 'mr-auto bg-gray-100 text-gray-800'
                } rounded-lg p-3 shadow`}
              >
                <div className="message-content">
                  {msg.content.split('\n').map((line, i) => {
                    // Check if this line is a product suggestion
                    if (line.match(/^\d+\.\s.+\s-\s\$\d+/)) {
                      return (
                        <p key={i} className="whitespace-pre-wrap font-medium text-blue-700 bg-blue-50 p-2 rounded my-1">
                          {line}
                        </p>
                      );
                    }
                    // Check if this is a section header for products
                    else if (line.includes("I found some") || line.includes("Here are some") || line.includes("SUGGESTED")) {
                      return (
                        <p key={i} className="whitespace-pre-wrap font-medium text-blue-800 mt-3 mb-2">
                          {line}
                        </p>
                      );
                    }
                    // Check if this is a section header
                    else if (line.match(/^[A-Z\s]+:$/) || line.includes("ROOMS:") || line.includes("BUDGET:") || line.includes("DESIGN STYLE:")) {
                      return (
                        <p key={i} className="whitespace-pre-wrap font-semibold text-gray-900 mt-3 mb-1">
                          {line}
                        </p>
                      );
                    }
                    // Regular line
                    else {
                      return (
                        <p key={i} className="whitespace-pre-wrap mb-1">
                          {line}
                        </p>
                      );
                    }
                  })}
                </div>
                <div className="text-xs opacity-70 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {/* Show product card if available */}
            {showProductCard && (
              <div className="mr-auto">
                <ProductCard product={showProductCard} />
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex flex-col space-y-3">
          {showSaveButton && user && (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
              <div>
                <p className="text-sm font-medium text-blue-800">Ready to save your project?</p>
                <p className="text-xs text-blue-600">Save your estimate to access it later or share with contractors.</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Prompt the user for an email address
                    const email = prompt("Enter email address to send the estimate:");
                    if (email) {
                      // Send a message to the chatbot to handle the email
                      const userMessage: Message = {
                        id: Date.now().toString(),
                        role: 'user',
                        content: `Please send my estimate to this email: ${email}`,
                        timestamp: new Date().toISOString()
                      };

                      setChatHistory(prev => [...prev, userMessage]);

                      // Simulate AI response delay
                      setTimeout(async () => {
                        let responseContent = '';
                        let updatedState = chatbotState;

                        if (useGpt && chatbotState) {
                          try {
                            // Format chat history for GPT
                            const formattedHistory = chatHistory.map(msg => ({
                              role: msg.role as 'user' | 'assistant',
                              content: msg.content
                            }));

                            // Add the new message
                            formattedHistory.push({
                              role: 'user',
                              content: userMessage.content
                            });

                            // Call GPT service
                            const result = await generateGptResponse(
                              chatbotState,
                              userMessage.content,
                              formattedHistory
                            );

                            responseContent = result.response;
                            updatedState = result.updatedState;
                            setChatbotState(updatedState);
                          } catch (error) {
                            console.error('Error with GPT chatbot:', error);
                            responseContent = "I'm sorry, I encountered an error sending the email. Please try again.";
                          }
                        } else {
                          responseContent = `I've sent your estimate to ${email}. You should receive it shortly!`;
                        }

                        const assistantMessage: Message = {
                          id: (Date.now() + 1).toString(),
                          role: 'assistant',
                          content: responseContent,
                          timestamp: new Date().toISOString()
                        };

                        setChatHistory(prev => [...prev, assistantMessage]);
                      }, 1000);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email Estimate
                </button>
                <button
                  onClick={handleSaveProject}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Project'
                  )}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="input-field flex-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn-primary ml-2"
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send'
              )}
            </button>
          </form>

          {!user && useNewChatbot && (
            <div className="text-center text-sm text-gray-500 mt-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                className="text-primary hover:underline"
              >
                Sign in
              </button> to save your estimate and access it later
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleChat;
