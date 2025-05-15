import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage, selectConversationHistory, selectEstimateLoading, addMessage } from '../store/slices/estimateSlice';
import type { AppDispatch } from '../store';
import { setActiveTab } from '../store/slices/uiSlice';
import { searchProducts } from '../mocks/productData';

interface ConversationUIProps {
  estimateId: string;
}

const ConversationUI: React.FC<ConversationUIProps> = ({ estimateId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const conversationHistory = useSelector(selectConversationHistory);
  const loading = useSelector(selectEstimateLoading);

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Helper function to detect action suggestions in messages
  const detectActionSuggestions = (content: string) => {
    // Check for product search suggestions
    if (content.includes('search_products') ||
        content.toLowerCase().includes('i found some products')) {
      return 'product_search';
    }

    // Check for room addition suggestions
    if (content.includes('add_room') ||
        content.toLowerCase().includes('add a room') ||
        content.toLowerCase().includes('create a new room')) {
      return 'add_room';
    }

    // Check for cost data suggestions
    if (content.includes('show_cost_data') ||
        content.toLowerCase().includes('cost data') ||
        content.toLowerCase().includes('pricing information')) {
      return 'cost_data';
    }

    return null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending message:', message);

    if (!message.trim()) return;

    try {
      // Create a user message object
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Add the user message to the conversation history
      dispatch(addMessage(userMessage));
      console.log('Added user message to conversation history');

      // Clear the input field
      setMessage('');

      try {
        // Try to send the message to the backend
        const result = await dispatch(sendMessage({ estimateId, content: message }));

        // Check if the response suggests an action
        if (result.payload && result.payload.content) {
          const suggestedAction = detectActionSuggestions(result.payload.content);

          // If there's a suggested action, handle it
          if (suggestedAction === 'cost_data') {
            // Navigate to cost data tab
            setTimeout(() => {
              dispatch(setActiveTab('costData'));
            }, 1500);
          }
        }
      } catch (error) {
        console.error('Error sending message to backend:', error);

        // If backend call fails, create a mock assistant response
        const mockResponses = {
          greeting: "Hi there! I'm BuildSmart by FAIT, your remodeling estimate assistant. I can help you create a detailed estimate for your project. What kind of remodeling are you planning?",
          kitchen: "Kitchen remodels are one of our specialties! The average kitchen remodel costs between $25,000 and $40,000 depending on the quality level. Would you like to add a kitchen to your estimate? I'll need the dimensions to calculate labor costs accurately.",
          bathroom: "Bathroom renovations typically range from $10,000 to $30,000 depending on the quality level and fixtures you choose. Would you like to add a bathroom to your estimate? What are the approximate dimensions?",
          basement: "Finishing a basement can add valuable living space to your home. Costs typically range from $30-$75 per square foot depending on the features you want. What's the approximate square footage of your basement?",
          products: "I can help you find products that match your style and budget. What specific items are you looking for? For example, I can suggest options for cabinets, countertops, flooring, fixtures, and appliances.",
          cost: "I can provide cost estimates for different room types and quality levels. Would you like to see our cost data for a specific room type?",
          default: "I'm here to help you build your remodeling estimate. I can add rooms to your estimate, suggest products, calculate costs, and more. What would you like to know about your project?"
        };

        // Determine which response to use based on the user's message
        let responseContent = mockResponses.default;
        const lowerMessage = message.toLowerCase();

        // Check for product search queries
        let foundProducts: any[] = [];
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
            foundProducts = searchProducts(searchTerm);

            if (foundProducts.length > 0) {
              // Create a response with product recommendations
              responseContent = `I found some ${searchTerm} options that might work for your project:\n\n`;

              // Add up to 3 products to the response
              foundProducts.slice(0, 3).forEach((product, index) => {
                responseContent += `${index + 1}. ${product.name} - $${product.price}\n`;
                responseContent += `   ${product.description}\n\n`;
              });

              responseContent += `Would you like to add any of these to your estimate? Or would you like to see more options?`;
            }
          }
        }

        // If no products were found, use the standard responses
        if (foundProducts.length === 0) {
          if (conversationHistory.length === 0) {
            responseContent = mockResponses.greeting;
          } else if (lowerMessage.includes('kitchen')) {
            responseContent = mockResponses.kitchen;
          } else if (lowerMessage.includes('bathroom') || lowerMessage.includes('bath')) {
            responseContent = mockResponses.bathroom;
          } else if (lowerMessage.includes('basement')) {
            responseContent = mockResponses.basement;
          } else if (lowerMessage.includes('product') || lowerMessage.includes('fixture') || lowerMessage.includes('material')) {
            responseContent = mockResponses.products;
          } else if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('how much')) {
            responseContent = mockResponses.cost;
          }
        }

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date().toISOString()
        };

        // Add the assistant message to the conversation history
        console.log('Preparing to add assistant response:', responseContent);
        setTimeout(() => {
          dispatch(addMessage(assistantMessage));
          console.log('Added assistant message to conversation history');
        }, 1000);
      }
    } catch (error) {
      console.error('Error in message handling:', error);
    }
  };

  // Debug information
  console.log('Current conversation history:', conversationHistory);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.length === 0 ? (
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
          conversationHistory.map((msg) => (
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
                  else if (line.includes("I found some products")) {
                    return (
                      <p key={i} className="whitespace-pre-wrap font-medium text-blue-800 mt-3 mb-2">
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary ml-2"
            disabled={loading || !message.trim()}
          >
            {loading ? (
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
      </div>
    </div>
  );
};

export default ConversationUI;
