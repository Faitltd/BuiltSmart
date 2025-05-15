document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const switchBotBtn = document.getElementById('switch-bot-btn');
    const savePrompt = document.getElementById('save-prompt');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const signInBtn = document.getElementById('sign-in-btn');
    const signInPromptBtn = document.getElementById('sign-in-prompt-btn');
    const authModal = document.getElementById('auth-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const signinTab = document.getElementById('signin-tab');
    const signupTab = document.getElementById('signup-tab');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const signinSubmit = document.getElementById('signin-submit');
    const signupSubmit = document.getElementById('signup-submit');

    // Chat state with more detailed structure
    let chatbotState = {
        stage: 'greeting',
        rooms: [],
        currentRoomIndex: -1,
        budget: null,
        preferences: {
            designStyle: null,
            colorPreferences: [],
            materialPreferences: []
        },
        productSuggestions: [],
        laborCosts: [],
        totalEstimate: {
            productsCost: 0,
            laborCost: 0,
            tax: 0,
            total: 0
        },
        conversationHistory: []
    };

    // Conversation stages enum for better code organization
    const ConversationStage = {
        GREETING: 'greeting',
        ROOM_SELECTION: 'room_selection',
        ROOM_DIMENSIONS: 'room_dimensions',
        BUDGET: 'budget',
        DESIGN_PREFERENCES: 'design_preferences',
        PRODUCT_SUGGESTIONS: 'product_suggestions',
        SUMMARY: 'summary'
    };

    // Room types enum
    const RoomType = {
        KITCHEN: 'kitchen',
        BATHROOM: 'bathroom',
        LIVING_ROOM: 'living_room',
        BEDROOM: 'bedroom',
        BASEMENT: 'basement',
        OTHER: 'other'
    };

    // Design styles enum
    const DesignStyle = {
        MODERN: 'modern',
        TRADITIONAL: 'traditional',
        CONTEMPORARY: 'contemporary',
        FARMHOUSE: 'farmhouse',
        INDUSTRIAL: 'industrial',
        MINIMALIST: 'minimalist',
        RUSTIC: 'rustic',
        TRANSITIONAL: 'transitional'
    };

    // User state
    let userState = {
        isLoggedIn: false,
        email: null,
        userId: null,
        projects: []
    };

    // Clear existing chat messages (for demo purposes)
    chatMessages.innerHTML = '';

    // Initialize chat with greeting message
    initializeChat();

    // Event Listeners with improved error handling
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        handleSendMessage();
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Focus input field when page loads
    userInput.focus();

    // Add input validation - prevent empty messages
    userInput.addEventListener('input', () => {
        sendButton.disabled = userInput.value.trim() === '';
        if (sendButton.disabled) {
            sendButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    // Bot switching functionality
    switchBotBtn.addEventListener('click', toggleChatbot);

    // Project saving functionality
    saveProjectBtn.addEventListener('click', saveProject);

    // Authentication related event listeners
    signInBtn.addEventListener('click', openAuthModal);
    signInPromptBtn.addEventListener('click', openAuthModal);
    closeModalBtn.addEventListener('click', closeAuthModal);
    signinTab.addEventListener('click', () => switchAuthTab('signin'));
    signupTab.addEventListener('click', () => switchAuthTab('signup'));

    // Form submission handlers with validation
    signinSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        if (!validateEmail(email)) {
            showAuthError('signin', 'Please enter a valid email address');
            return;
        }

        if (!password) {
            showAuthError('signin', 'Please enter your password');
            return;
        }

        handleSignIn(e);
    });

    signupSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        if (!validateEmail(email)) {
            showAuthError('signup', 'Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            showAuthError('signup', 'Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            showAuthError('signup', 'Passwords do not match');
            return;
        }

        handleSignUp(e);
    });

    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal.classList.contains('active')) {
            closeAuthModal();
        }
    });

    // Core chatbot functions
    function initializeChat() {
        // Set initial state
        chatbotState.stage = ConversationStage.GREETING;
        chatbotState.conversationHistory = [];

        // Add greeting message with a more natural, conversational tone
        const greeting = "Hi there! I'm BuildSmart by FAIT, your remodeling assistant. I can help you plan your project and create a detailed cost estimate. Just chat with me naturally about your remodeling ideas, and I'll guide the conversation while gathering the information I need.\n\nWhat kind of remodeling project are you thinking about?";
        addBotMessage(greeting);

        // Log conversation
        logConversation('bot', greeting);
    }

    function handleSendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addUserMessage(message);

        // Log conversation
        logConversation('user', message);

        // Clear input and disable send button
        userInput.value = '';
        sendButton.disabled = true;
        sendButton.classList.add('opacity-50', 'cursor-not-allowed');

        // Show typing indicator
        showTypingIndicator();

        // Process user message and generate response with variable delay for realism
        const typingDelay = Math.floor(Math.random() * 500) + 800; // 800-1300ms
        setTimeout(() => {
            removeTypingIndicator();
            processUserMessage(message);
        }, typingDelay);
    }

    // Function to process user messages using a more natural conversation flow
    function processUserMessage(message) {
        // Log message details for debugging
        console.log(`Processing message in stage: ${chatbotState.stage}`);
        console.log(`Number of rooms: ${chatbotState.rooms.length}`);
        console.log(`Message: "${message}"`);

        // Check for summary request keywords
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('summarize') ||
            lowerMessage.includes('summary') ||
            lowerMessage.includes('finish') ||
            lowerMessage.includes('complete') ||
            lowerMessage.includes('done') ||
            lowerMessage.includes('that\'s all') ||
            lowerMessage.includes('thats all')) {

            generateSummary();
            return;
        }

        // Extract information in the background
        console.log("Starting information extraction");
        extractRoomInformation(message);
        extractDimensionInformation(message);
        extractBudgetInformation(message);
        extractDesignPreferences(message);

        // Generate a natural response using the LLM
        generateNaturalResponse(message);
    }

    // Track the last question type asked to avoid repetition
    let lastQuestionType = null;
    // Track budget extraction attempts
    let budgetAttempts = 0;

    // Function to generate a natural response using LLM (simulated for now)
    function generateNaturalResponse(userMessage) {
        // Get the current state of collected information
        const missingInfo = getMissingInformation();

        // Create a context object for the LLM
        const context = {
            conversationHistory: chatbotState.conversationHistory.slice(-10), // Last 10 messages
            collectedInfo: {
                rooms: chatbotState.rooms,
                budget: chatbotState.budget,
                preferences: chatbotState.preferences
            },
            missingInfo: missingInfo,
            lastQuestionType: lastQuestionType
        };

        // Check if the user's message contains a budget after we've asked about it
        const lowerMessage = userMessage.toLowerCase();
        const containsBudgetInfo = lowerMessage.includes('$') ||
                                  lowerMessage.includes('dollar') ||
                                  lowerMessage.includes('budget') ||
                                  lowerMessage.includes('thousand') ||
                                  lowerMessage.includes('k') ||
                                  /\d{4,}/.test(lowerMessage); // Contains numbers that could be a budget

        // If we just asked about budget and the user's message might contain budget info,
        // don't ask about budget again even if extraction failed
        const skipBudgetQuestion = lastQuestionType === 'budget' && containsBudgetInfo;

        // In a real implementation, we would call an LLM API here
        // For now, we'll simulate responses based on the missing information
        let response;
        let newQuestionType = null;

        // If the user just provided what looks like a budget number but we failed to extract it,
        // try to handle it gracefully
        if (lastQuestionType === 'budget' && containsBudgetInfo && missingInfo.needsBudget) {
            budgetAttempts++;

            // After two attempts, just create a default budget based on the rooms
            if (budgetAttempts >= 2) {
                // Calculate a default budget based on room square footage
                const totalSqFt = chatbotState.rooms.reduce((total, room) => {
                    return total + (room.dimensions?.squareFootage || 0);
                }, 0);

                // Assume $100 per square foot as a default
                const defaultBudget = totalSqFt * 100;
                const min = Math.floor(defaultBudget * 0.8);
                const max = Math.ceil(defaultBudget * 1.2);

                // Store budget in state
                chatbotState.budget = {
                    min,
                    max,
                    target: defaultBudget,
                    perSqFt: 100
                };

                console.log("Created default budget after failed attempts:", chatbotState.budget);

                // Acknowledge the budget and move on
                const budgetAcknowledgements = [
                    `I'll work with a budget of around $${defaultBudget.toLocaleString()} for your project. Now, let's talk about design preferences.`,
                    `Based on your space, I'm estimating a budget of approximately $${defaultBudget.toLocaleString()}. Does that sound reasonable?`,
                    `I've noted a budget of about $${defaultBudget.toLocaleString()} for your project. Let's move on to design preferences.`
                ];
                response = budgetAcknowledgements[Math.floor(Math.random() * budgetAcknowledgements.length)];
                newQuestionType = 'design';
            }
        }

        if (missingInfo.needsRooms) {
            // If we need rooms, generate a natural question about rooms
            const roomResponses = [
                "I'd love to help with your remodeling project. Which rooms are you planning to update?",
                "To get started with your estimate, could you tell me which rooms you're looking to remodel?",
                "What areas of your home are you thinking about renovating?",
                "Which spaces in your home would you like to focus on for this remodeling project?"
            ];
            response = roomResponses[Math.floor(Math.random() * roomResponses.length)];
            newQuestionType = 'rooms';
        }
        else if (missingInfo.needsDimensions) {
            // If we need dimensions, ask about the specific room
            const room = chatbotState.rooms.find(r => !r.dimensions);
            const dimensionResponses = [
                `How large is your ${room.name}? You can give me the dimensions or just describe it as small, medium, or large.`,
                `What are the approximate dimensions of your ${room.name}?`,
                `Could you tell me about the size of your ${room.name}? Rough estimates are fine.`,
                `For your ${room.name}, what kind of square footage or dimensions are we working with?`
            ];
            response = dimensionResponses[Math.floor(Math.random() * dimensionResponses.length)];
            newQuestionType = 'dimensions';
        }
        else if (missingInfo.needsBudget && !skipBudgetQuestion) {
            // If we need budget information and we're not skipping budget questions
            const budgetResponses = [
                "What kind of budget range do you have in mind for this project?",
                "How much are you looking to invest in this renovation?",
                "Do you have a budget in mind for these updates?",
                "What's your approximate budget for this remodeling work?"
            ];
            response = budgetResponses[Math.floor(Math.random() * budgetResponses.length)];
            newQuestionType = 'budget';
        }
        else if (missingInfo.needsDesignPreferences) {
            // If we need design preferences
            const designResponses = [
                `What style are you envisioning for your ${chatbotState.rooms[0].name}?`,
                "Do you have any specific design styles or aesthetics you prefer?",
                "What kind of look and feel are you going for with this remodel?",
                "Any particular design styles, colors, or materials you're drawn to?"
            ];
            response = designResponses[Math.floor(Math.random() * designResponses.length)];
            newQuestionType = 'design';
        }
        else if (chatbotState.productSuggestions.length === 0) {
            // If we have all essential info but no product suggestions yet
            const productRecommendations = generateProductRecommendations();
            chatbotState.productSuggestions = productRecommendations;

            // Format product recommendations for display
            let productsText = '';
            productRecommendations.forEach((product, index) => {
                productsText += `${index + 1}. ${product.name} - $${product.price.toLocaleString()}\n   ${product.description}\n\n`;
            });

            response = `Based on what you've shared about your project, here are some products that might work well for your ${chatbotState.rooms[0].name}:\n\n${productsText}\nWhat do you think of these options?`;
            newQuestionType = 'products';
        }
        else {
            // If we have all the information, provide a helpful response
            const generalResponses = [
                "Is there anything specific about your project you'd like to discuss in more detail?",
                "Would you like me to explain any part of the remodeling process or suggest more product options?",
                "Is there anything else you'd like to know about your renovation project?",
                "Would you like me to summarize what we've discussed so far?"
            ];
            response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
            newQuestionType = 'general';
        }

        // If we're about to ask the same type of question again, try a different approach
        if (newQuestionType === lastQuestionType && newQuestionType === 'budget') {
            // If we're stuck on budget questions, move on to design preferences or provide a general response
            if (chatbotState.rooms.length > 0) {
                const alternateResponses = [
                    `Let's talk about the design for your ${chatbotState.rooms[0].name}. What style are you thinking about?`,
                    "What kind of look and feel would you like for your remodeled space?",
                    "We can refine the budget later. For now, let's talk about your design preferences. Any particular styles you like?",
                    "I'll work with your budget range. Let's discuss what features are most important to you in this remodel."
                ];
                response = alternateResponses[Math.floor(Math.random() * alternateResponses.length)];
                newQuestionType = 'design';

                // Reset budget attempts counter
                budgetAttempts = 0;
            }
        }

        // Reset budget attempts if we're moving to a different question type
        if (lastQuestionType === 'budget' && newQuestionType !== 'budget') {
            budgetAttempts = 0;
        }

        // Update the last question type
        lastQuestionType = newQuestionType;

        // Add the response to the chat
        addBotMessage(response);

        // Log the conversation
        logConversation('bot', response);
    }

    // Function to determine what information is still missing
    function getMissingInformation() {
        return {
            needsRooms: chatbotState.rooms.length === 0,
            needsDimensions: chatbotState.rooms.some(room => !room.dimensions),
            needsBudget: !chatbotState.budget && chatbotState.rooms.length > 0,
            needsDesignPreferences: !chatbotState.preferences.designStyle && chatbotState.budget
        };
    }

    // Function to extract room information from a message
    function extractRoomInformation(message) {
        const lowerMessage = message.toLowerCase();

        // Check for room mentions
        if (lowerMessage.includes('kitchen') && !chatbotState.rooms.some(room => room.type === RoomType.KITCHEN)) {
            chatbotState.rooms.push({
                type: RoomType.KITCHEN,
                name: 'kitchen'
            });
        }

        if ((lowerMessage.includes('bathroom') || lowerMessage.includes('bath')) &&
            !chatbotState.rooms.some(room => room.type === RoomType.BATHROOM)) {
            chatbotState.rooms.push({
                type: RoomType.BATHROOM,
                name: 'bathroom'
            });
        }

        if ((lowerMessage.includes('living') || lowerMessage.includes('family')) &&
            !chatbotState.rooms.some(room => room.type === RoomType.LIVING_ROOM)) {
            chatbotState.rooms.push({
                type: RoomType.LIVING_ROOM,
                name: 'living room'
            });
        }

        if ((lowerMessage.includes('bedroom') || lowerMessage.includes('bed room')) &&
            !chatbotState.rooms.some(room => room.type === RoomType.BEDROOM)) {
            chatbotState.rooms.push({
                type: RoomType.BEDROOM,
                name: 'bedroom'
            });
        }

        if (lowerMessage.includes('basement') &&
            !chatbotState.rooms.some(room => room.type === RoomType.BASEMENT)) {
            chatbotState.rooms.push({
                type: RoomType.BASEMENT,
                name: 'basement'
            });
        }
    }

    // Function to extract dimension information from a message
    // Returns true if dimensions were extracted, false otherwise
    function extractDimensionInformation(message) {
        if (chatbotState.rooms.length === 0) return false;

        const lowerMessage = message.toLowerCase();

        // Regular expressions for different dimension formats
        const dimensionsRegex = /(\d+)\s*(?:x|by|×)\s*(\d+)/i;
        const squareFootageRegex = /(\d+)\s*(?:sq\s*ft|square\s*feet|square\s*foot|sqft)/i;
        const dimensionsMentionRegex = /(\d+)\s*(?:feet|foot|ft|')\s*(?:by|x)?\s*(\d+)\s*(?:feet|foot|ft|')/i;

        // Try to match different formats
        const dimensionsMatch = lowerMessage.match(dimensionsRegex) || lowerMessage.match(dimensionsMentionRegex);
        const squareFootageMatch = lowerMessage.match(squareFootageRegex);

        // Find a room without dimensions to apply this to
        const roomWithoutDimensions = chatbotState.rooms.find(room => !room.dimensions);
        if (!roomWithoutDimensions) return false;

        if (dimensionsMatch) {
            // Extract length and width
            const length = parseInt(dimensionsMatch[1]);
            const width = parseInt(dimensionsMatch[2]);
            const squareFootage = length * width;

            // Validate dimensions (basic sanity check)
            if (length > 100 || width > 100 || length < 1 || width < 1) {
                return false; // Invalid dimensions
            }

            // Update room
            roomWithoutDimensions.dimensions = {
                length,
                width,
                squareFootage,
                unit: 'feet'
            };

            return true; // Successfully extracted dimensions
        } else if (squareFootageMatch) {
            // Extract square footage directly
            const squareFootage = parseInt(squareFootageMatch[1]);

            // Validate square footage (basic sanity check)
            if (squareFootage > 10000 || squareFootage < 10) {
                return false; // Invalid square footage
            }

            // Update room
            roomWithoutDimensions.dimensions = {
                squareFootage,
                unit: 'feet'
            };

            return true; // Successfully extracted dimensions
        } else if (lowerMessage.includes('small') || lowerMessage.includes('medium') || lowerMessage.includes('large')) {
            // Handle descriptive sizes
            let squareFootage;
            let sizeDescription;

            if (lowerMessage.includes('small')) {
                sizeDescription = "small";
                squareFootage = roomWithoutDimensions.type === RoomType.BATHROOM ? 40 :
                               roomWithoutDimensions.type === RoomType.KITCHEN ? 100 :
                               roomWithoutDimensions.type === RoomType.BEDROOM ? 120 : 150;
            } else if (lowerMessage.includes('medium')) {
                sizeDescription = "medium";
                squareFootage = roomWithoutDimensions.type === RoomType.BATHROOM ? 60 :
                               roomWithoutDimensions.type === RoomType.KITCHEN ? 150 :
                               roomWithoutDimensions.type === RoomType.BEDROOM ? 180 : 250;
            } else { // large
                sizeDescription = "large";
                squareFootage = roomWithoutDimensions.type === RoomType.BATHROOM ? 80 :
                               roomWithoutDimensions.type === RoomType.KITCHEN ? 200 :
                               roomWithoutDimensions.type === RoomType.BEDROOM ? 250 : 350;
            }

            // Update room
            roomWithoutDimensions.dimensions = {
                squareFootage,
                unit: 'feet',
                isEstimate: true,
                sizeDescription
            };

            return true; // Successfully extracted dimensions
        }

        // If we got here, no dimensions were extracted
        return false;
    }

    // Function to extract budget information from a message
    function extractBudgetInformation(message) {
        if (chatbotState.budget) return; // Already have budget
        if (chatbotState.rooms.length === 0) return; // Need rooms first

        const lowerMessage = message.toLowerCase();

        // Check for plain numbers that might be budget amounts
        // Look for numbers with or without commas, with or without dollar signs
        const plainNumberMatch = lowerMessage.match(/\$?(\d{1,3}(,\d{3})*|\d+)k?\b/i) ||
                                lowerMessage.match(/\b(\d{4,})\b/);

        // If we have a plain number (like "10000" or "$10,000" or "10k"), treat it as a budget
        if (plainNumberMatch && !lowerMessage.includes('x') && !lowerMessage.includes('by')) {
            console.log("Found plain number that might be budget:", plainNumberMatch[0]);

            // Extract the numeric part
            let budgetStr = plainNumberMatch[1] || plainNumberMatch[0];
            budgetStr = budgetStr.replace(/[$,]/g, ''); // Remove $ and commas

            // Check if it's a "k" format (like 10k)
            const isKFormat = /k$/i.test(budgetStr);
            if (isKFormat) {
                budgetStr = budgetStr.replace(/k$/i, '');
                budgetStr = parseFloat(budgetStr) * 1000;
            }

            const budget = parseInt(budgetStr);
            console.log("Parsed budget value:", budget);

            // Validate budget (basic sanity check)
            if (budget >= 1000 && budget <= 1000000) {
                // Create a range around the single value
                const min = Math.floor(budget * 0.8);
                const max = Math.ceil(budget * 1.2);

                // Calculate total square footage for all rooms
                const totalSqFt = chatbotState.rooms.reduce((total, room) => {
                    return total + (room.dimensions?.squareFootage || 0);
                }, 0);

                // Store budget in state
                chatbotState.budget = {
                    min,
                    max,
                    target: budget,
                    perSqFt: totalSqFt > 0 ? Math.round(budget / totalSqFt) : 0
                };

                console.log("Extracted budget from plain number:", chatbotState.budget);
                return;
            }
        }

        // Check if this is clearly a dimension message and not a budget
        const dimensionIndicators = lowerMessage.includes('x') ||
                                   lowerMessage.includes('by') ||
                                   lowerMessage.includes('feet') ||
                                   lowerMessage.includes('ft') ||
                                   lowerMessage.includes('square') ||
                                   lowerMessage.includes('dimensions');

        const budgetIndicators = lowerMessage.includes('$') ||
                                lowerMessage.includes('dollar') ||
                                lowerMessage.includes('budget') ||
                                lowerMessage.includes('spend') ||
                                lowerMessage.includes('cost') ||
                                lowerMessage.includes('thousand') ||
                                lowerMessage.includes('k') ||
                                lowerMessage.includes('million');

        // If it looks like dimensions and not budget, skip budget extraction
        if (dimensionIndicators && !budgetIndicators) {
            console.log("Skipping budget extraction for dimension message");
            return;
        }

        // Regular expressions for different budget formats
        const budgetRangeRegex = /\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\s*-\s*|\s*to\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)/i;
        const singleBudgetRegex = /\$(\d{1,3}(?:,\d{3})*|\d+)(?:k)?\b/i; // More specific to dollar amounts
        const budgetKeywordsRegex = /(low|tight|limited|small|modest|medium|average|high|large|luxury|premium|expensive|unlimited)/i;

        // Calculate total square footage for all rooms
        const totalSqFt = chatbotState.rooms.reduce((total, room) => {
            return total + (room.dimensions?.squareFootage || 0);
        }, 0);

        // Try to match different formats
        const budgetRangeMatch = lowerMessage.match(budgetRangeRegex);
        const budgetKeywordMatch = lowerMessage.match(budgetKeywordsRegex);
        const singleBudgetMatch = lowerMessage.match(singleBudgetRegex);

        if (budgetRangeMatch) {
            // Extract min and max budget
            const min = parseInt(budgetRangeMatch[1].replace(/,/g, ''));
            const max = parseInt(budgetRangeMatch[2].replace(/,/g, ''));

            // Validate budget (basic sanity check)
            if (min < 1000 || max < 1000 || min > 1000000 || max > 1000000) {
                return; // Invalid budget
            }

            // Store budget in state
            chatbotState.budget = {
                min,
                max,
                perSqFt: Math.round((min + max) / (2 * totalSqFt))
            };
        } else if (budgetKeywordMatch) {
            // Handle descriptive budget terms
            const budgetKeyword = budgetKeywordMatch[1].toLowerCase();
            let min, max;

            // Set budget ranges based on keywords and project size
            if (budgetKeyword === 'low' || budgetKeyword === 'tight' || budgetKeyword === 'limited' ||
                budgetKeyword === 'small' || budgetKeyword === 'modest') {
                min = totalSqFt * 75;
                max = totalSqFt * 125;
            } else if (budgetKeyword === 'medium' || budgetKeyword === 'average') {
                min = totalSqFt * 125;
                max = totalSqFt * 225;
            } else { // high, large, luxury, premium, expensive, unlimited
                min = totalSqFt * 225;
                max = totalSqFt * 400;
            }

            // Round to nice numbers
            min = Math.round(min / 1000) * 1000;
            max = Math.round(max / 1000) * 1000;

            // Ensure minimum values
            min = Math.max(min, 5000);
            max = Math.max(max, 10000);

            // Store budget in state
            chatbotState.budget = {
                min,
                max,
                keyword: budgetKeyword,
                perSqFt: Math.round((min + max) / (2 * totalSqFt))
            };
        } else if (singleBudgetMatch &&
                  lowerMessage.includes('$') &&
                  !lowerMessage.includes('per') &&
                  !lowerMessage.includes('square')) {
            // Extract single budget amount
            let budgetStr = singleBudgetMatch[1].replace(/,/g, '');

            // Check if it's a "k" format (like $10k)
            const isKFormat = /k$/i.test(budgetStr);
            if (isKFormat) {
                budgetStr = budgetStr.replace(/k$/i, '');
                budgetStr = parseFloat(budgetStr) * 1000;
            }

            const budget = parseInt(budgetStr);
            console.log("Parsed dollar amount budget:", budget);

            // Validate budget (basic sanity check)
            if (budget < 1000 || budget > 1000000) {
                return; // Invalid budget
            }

            // Create a range around the single value
            const min = Math.floor(budget * 0.8);
            const max = Math.ceil(budget * 1.2);

            // Store budget in state
            chatbotState.budget = {
                min,
                max,
                target: budget,
                perSqFt: Math.round(budget / totalSqFt)
            };
        }
    }

    // Function to extract design preferences from a message
    function extractDesignPreferences(message) {
        if (!chatbotState.budget) return; // Need budget first

        const lowerMessage = message.toLowerCase();

        // Check for specific design styles
        const styleMatches = {
            [DesignStyle.MODERN]: ['modern', 'sleek', 'clean lines', 'minimalist', 'contemporary'],
            [DesignStyle.TRADITIONAL]: ['traditional', 'classic', 'timeless', 'elegant'],
            [DesignStyle.CONTEMPORARY]: ['contemporary', 'current', 'present-day'],
            [DesignStyle.FARMHOUSE]: ['farmhouse', 'rustic', 'country', 'barn', 'shiplap'],
            [DesignStyle.INDUSTRIAL]: ['industrial', 'factory', 'warehouse', 'metal', 'pipes', 'exposed'],
            [DesignStyle.MINIMALIST]: ['minimalist', 'simple', 'clean', 'uncluttered', 'minimal'],
            [DesignStyle.RUSTIC]: ['rustic', 'natural', 'weathered', 'distressed', 'reclaimed'],
            [DesignStyle.TRANSITIONAL]: ['transitional', 'blend', 'mix', 'balance']
        };

        // Find the style with the most matches
        let bestMatchCount = 0;
        let bestMatchStyle = null;

        Object.entries(styleMatches).forEach(([style, keywords]) => {
            const matchCount = keywords.reduce((count, keyword) => {
                return count + (lowerMessage.includes(keyword) ? 1 : 0);
            }, 0);

            if (matchCount > bestMatchCount) {
                bestMatchCount = matchCount;
                bestMatchStyle = style;
            }
        });

        if (bestMatchCount > 0) {
            chatbotState.preferences.designStyle = bestMatchStyle;
        }

        // Extract color preferences
        const colorRegex = /(white|black|gray|grey|blue|green|red|yellow|brown|beige|cream|navy|teal|purple|pink|orange|silver|gold|bronze|copper|tan|ivory|charcoal|slate)/gi;
        const colorMatches = lowerMessage.match(colorRegex);

        if (colorMatches) {
            chatbotState.preferences.colorPreferences = Array.from(new Set([
                ...chatbotState.preferences.colorPreferences,
                ...colorMatches.map(c => c.toLowerCase())
            ]));
        }

        // Extract material preferences
        const materialRegex = /(wood|marble|granite|quartz|tile|ceramic|porcelain|glass|metal|steel|brass|copper|concrete|laminate|vinyl|hardwood|oak|maple|pine|cherry|bamboo|cork|stone|brick|stainless|acrylic|composite|engineered)/gi;
        const materialMatches = lowerMessage.match(materialRegex);

        if (materialMatches) {
            chatbotState.preferences.materialPreferences = Array.from(new Set([
                ...chatbotState.preferences.materialPreferences,
                ...materialMatches.map(m => m.toLowerCase())
            ]));
        }

        // Extract additional preferences
        if (lowerMessage.includes('eco') || lowerMessage.includes('sustainable') || lowerMessage.includes('green')) {
            if (!chatbotState.preferences.additionalPreferences) {
                chatbotState.preferences.additionalPreferences = [];
            }
            if (!chatbotState.preferences.additionalPreferences.includes('eco-friendly')) {
                chatbotState.preferences.additionalPreferences.push('eco-friendly');
            }
        }

        if (lowerMessage.includes('low maintenance') || lowerMessage.includes('easy to clean')) {
            if (!chatbotState.preferences.additionalPreferences) {
                chatbotState.preferences.additionalPreferences = [];
            }
            if (!chatbotState.preferences.additionalPreferences.includes('low-maintenance')) {
                chatbotState.preferences.additionalPreferences.push('low-maintenance');
            }
        }

        if (lowerMessage.includes('durable') || lowerMessage.includes('long lasting')) {
            if (!chatbotState.preferences.additionalPreferences) {
                chatbotState.preferences.additionalPreferences = [];
            }
            if (!chatbotState.preferences.additionalPreferences.includes('durable')) {
                chatbotState.preferences.additionalPreferences.push('durable');
            }
        }
    }

    // Function to generate a summary of the project
    function generateSummary() {
        // Calculate total square footage
        const totalSqFt = chatbotState.rooms.reduce((total, room) => {
            return total + (room.dimensions?.squareFootage || 0);
        }, 0);

        // Format room information
        let roomsText = '';
        chatbotState.rooms.forEach(room => {
            if (room.dimensions) {
                if (room.dimensions.length && room.dimensions.width) {
                    roomsText += `- ${room.name}: ${room.dimensions.length}' x ${room.dimensions.width}' (${room.dimensions.squareFootage} sq ft)\n`;
                } else if (room.dimensions.sizeDescription) {
                    roomsText += `- ${room.name}: ${room.dimensions.sizeDescription} (approx. ${room.dimensions.squareFootage} sq ft)\n`;
                } else {
                    roomsText += `- ${room.name}: ${room.dimensions.squareFootage} sq ft\n`;
                }
            } else {
                roomsText += `- ${room.name}: dimensions not specified\n`;
            }
        });

        // Format budget information
        let budgetText = '';
        if (chatbotState.budget) {
            if (chatbotState.budget.target) {
                budgetText = `$${chatbotState.budget.target.toLocaleString()} (range: $${chatbotState.budget.min.toLocaleString()}-$${chatbotState.budget.max.toLocaleString()})`;
            } else if (chatbotState.budget.keyword) {
                budgetText = `${chatbotState.budget.keyword} ($${chatbotState.budget.min.toLocaleString()}-$${chatbotState.budget.max.toLocaleString()})`;
            } else {
                budgetText = `$${chatbotState.budget.min.toLocaleString()}-$${chatbotState.budget.max.toLocaleString()}`;
            }
        } else {
            budgetText = 'Not specified';
        }

        // Format design preferences
        let designText = '';
        if (chatbotState.preferences.designStyle) {
            designText += chatbotState.preferences.designStyle;

            if (chatbotState.preferences.colorPreferences && chatbotState.preferences.colorPreferences.length > 0) {
                designText += ` with ${chatbotState.preferences.colorPreferences.join(', ')} colors`;
            }

            if (chatbotState.preferences.materialPreferences && chatbotState.preferences.materialPreferences.length > 0) {
                designText += ` and ${chatbotState.preferences.materialPreferences.join(', ')} materials`;
            }
        } else {
            designText = 'Not specified';
        }

        // Format product recommendations
        let productsText = '';
        if (chatbotState.productSuggestions && chatbotState.productSuggestions.length > 0) {
            chatbotState.productSuggestions.forEach((product, index) => {
                productsText += `${index + 1}. ${product.name} - $${product.price.toLocaleString()}\n`;
            });
        } else {
            productsText = 'No products selected';
        }

        // Calculate estimated total cost
        let totalProductCost = 0;
        if (chatbotState.productSuggestions) {
            totalProductCost = chatbotState.productSuggestions.reduce((total, product) => total + product.price, 0);
        }

        // Estimate labor cost based on square footage and room types
        let laborCost = 0;
        chatbotState.rooms.forEach(room => {
            if (room.dimensions && room.dimensions.squareFootage) {
                // Base labor rates per square foot
                let ratePerSqFt = 0;

                switch(room.type) {
                    case RoomType.KITCHEN:
                        ratePerSqFt = 150; // Higher for kitchens
                        break;
                    case RoomType.BATHROOM:
                        ratePerSqFt = 175; // Highest for bathrooms
                        break;
                    case RoomType.LIVING_ROOM:
                        ratePerSqFt = 75; // Lower for living rooms
                        break;
                    case RoomType.BEDROOM:
                        ratePerSqFt = 85; // Medium for bedrooms
                        break;
                    case RoomType.BASEMENT:
                        ratePerSqFt = 100; // Medium-high for basements
                        break;
                    default:
                        ratePerSqFt = 100; // Default rate
                }

                laborCost += room.dimensions.squareFootage * ratePerSqFt;
            }
        });

        // Calculate tax (estimate at 8%)
        const taxRate = 0.08;
        const tax = totalProductCost * taxRate;

        // Calculate total estimate
        const totalEstimate = totalProductCost + laborCost + tax;

        // Store in state
        chatbotState.totalEstimate = {
            productsCost: totalProductCost,
            laborCost: laborCost,
            tax: tax,
            total: totalEstimate
        };

        // Format the summary message
        const summaryMessage = `
## BuildSmart Project Summary

### Rooms to Remodel
${roomsText}
Total Area: ${totalSqFt} sq ft

### Budget
${budgetText}

### Design Style
${designText}

### Cost Estimate
- Materials: $${totalProductCost.toLocaleString()}
- Labor: $${laborCost.toLocaleString()}
- Tax (8%): $${tax.toLocaleString()}
- **Total Estimate: $${totalEstimate.toLocaleString()}**

Would you like to save this estimate or start a new one?
`;

        // Update stage
        chatbotState.stage = ConversationStage.SUMMARY;

        // Show save prompt
        savePrompt.style.display = 'block';

        // Add summary message
        addBotMessage(summaryMessage);
    }

    // Helper function to log conversation for analysis and history
    function logConversation(sender, message) {
        chatbotState.conversationHistory.push({
            sender,
            message,
            timestamp: new Date().toISOString()
        });

        // For debugging
        console.log(`[${sender}]: ${message}`);
    }

    // Reset chat to start over
    function resetChat() {
        // Save conversation history
        const previousConversation = [...chatbotState.conversationHistory];

        // Reset state
        chatbotState = {
            stage: ConversationStage.GREETING,
            rooms: [],
            currentRoomIndex: -1,
            budget: null,
            preferences: {
                designStyle: null,
                colorPreferences: [],
                materialPreferences: []
            },
            productSuggestions: [],
            laborCosts: [],
            totalEstimate: {
                productsCost: 0,
                laborCost: 0,
                tax: 0,
                total: 0
            },
            conversationHistory: previousConversation
        };

        // Hide save prompt if visible
        savePrompt.style.display = 'none';
    }

    function handleRoomSelection(message) {
        const lowerMessage = message.toLowerCase();

        // Detect multiple rooms
        const rooms = [];

        // Check for multiple rooms in the message
        if (lowerMessage.includes('kitchen')) {
            rooms.push(RoomType.KITCHEN);
        }

        if (lowerMessage.includes('bathroom') || lowerMessage.includes('bath')) {
            rooms.push(RoomType.BATHROOM);
        }

        if (lowerMessage.includes('living') || lowerMessage.includes('family')) {
            rooms.push(RoomType.LIVING_ROOM);
        }

        if (lowerMessage.includes('bedroom') || lowerMessage.includes('bed room')) {
            rooms.push(RoomType.BEDROOM);
        }

        if (lowerMessage.includes('basement')) {
            rooms.push(RoomType.BASEMENT);
        }

        // If no specific rooms detected but message contains remodel/renovation keywords
        if (rooms.length === 0 && (
            lowerMessage.includes('remodel') ||
            lowerMessage.includes('renovate') ||
            lowerMessage.includes('update') ||
            lowerMessage.includes('redo')
        )) {
            // Ask for specific rooms
            addBotMessage("I'd be happy to help with your remodeling project. Which specific room or rooms are you planning to remodel? For example, you can say 'kitchen', 'bathroom', 'living room', etc.");
            return;
        }

        // If no rooms detected at all
        if (rooms.length === 0) {
            // Ask for clarification
            addBotMessage("I'm not sure which room you're referring to. Could you please specify which room or rooms you want to remodel? For example: kitchen, bathroom, bedroom, living room, or basement.");
            return;
        }

        // Add rooms to state
        rooms.forEach(roomType => {
            chatbotState.rooms.push({
                type: roomType,
                name: formatRoomTypeName(roomType)
            });
        });

        // Set current room to first detected room
        chatbotState.currentRoomIndex = 0;

        // Update stage
        chatbotState.stage = ConversationStage.ROOM_DIMENSIONS;

        // Format response based on number of rooms
        if (rooms.length === 1) {
            const roomName = formatRoomTypeName(rooms[0]);
            addBotMessage(`Great! Let's talk about your ${roomName} remodel.\n\nI'll need to know the dimensions of your ${roomName} to calculate costs accurately. Please provide the length and width (for example, "10 feet by 12 feet" or "10x12") or the total square footage (for example, "120 square feet").`);
        } else {
            const roomsList = rooms.map(room => formatRoomTypeName(room)).join(', ');
            addBotMessage(`Great! You want to remodel multiple rooms: ${roomsList}.\n\nLet's start with the ${formatRoomTypeName(rooms[0])}. I'll need to know the dimensions of this room to calculate costs accurately. Please provide the length and width (for example, "10 feet by 12 feet" or "10x12") or the total square footage (for example, "120 square feet").`);
        }
    }

    // Helper function to format room type names for display
    function formatRoomTypeName(roomType) {
        switch(roomType) {
            case RoomType.LIVING_ROOM:
                return 'living room';
            default:
                return roomType;
        }
    }

    function handleRoomDimensions(message) {
        const lowerMessage = message.toLowerCase();
        console.log(`handleRoomDimensions called with message: "${message}"`);
        console.log(`Current room index: ${chatbotState.currentRoomIndex}`);

        // Validate that we have rooms and a valid current room index
        if (chatbotState.rooms.length === 0 || chatbotState.currentRoomIndex < 0 || chatbotState.currentRoomIndex >= chatbotState.rooms.length) {
            console.error("Invalid room state in handleRoomDimensions");
            // Reset to greeting stage if we're in an invalid state
            chatbotState.stage = ConversationStage.GREETING;
            addBotMessage("I'm sorry, but I seem to have lost track of our conversation. Let's start over. What kind of remodeling project are you planning?");
            return;
        }

        // Check if message looks like a budget instead of dimensions
        const budgetRegex = /\$|dollar|budget|cost|spend|afford/i;
        if (budgetRegex.test(lowerMessage)) {
            // User might be trying to provide budget information instead of dimensions
            addBotMessage("I see you might be mentioning your budget, but first I need to know the dimensions of the room. This helps me calculate material quantities and labor costs accurately. Please provide the room size (length and width or square footage).");
            return;
        }

        // Regular expressions for different dimension formats
        const dimensionsRegex = /(\d+)\s*(?:x|by|×)\s*(\d+)/i;
        const squareFootageRegex = /(\d+)\s*(?:sq\s*ft|square\s*feet|square\s*foot|sqft)/i;
        const dimensionsMentionRegex = /(\d+)\s*(?:feet|foot|ft|')\s*(?:by|x)?\s*(\d+)\s*(?:feet|foot|ft|')/i;
        const singleDimensionRegex = /(\d+)\s*(?:feet|foot|ft|')/i;

        // Try to match different formats
        const dimensionsMatch = lowerMessage.match(dimensionsRegex) || lowerMessage.match(dimensionsMentionRegex);
        const squareFootageMatch = lowerMessage.match(squareFootageRegex);
        const singleDimensionMatch = lowerMessage.match(singleDimensionRegex);

        // Current room being processed
        const currentRoom = chatbotState.rooms[chatbotState.currentRoomIndex];

        if (dimensionsMatch) {
            // Extract length and width
            const length = parseInt(dimensionsMatch[1]);
            const width = parseInt(dimensionsMatch[2]);
            const squareFootage = length * width;

            // Validate dimensions (basic sanity check)
            if (length > 100 || width > 100 || length < 1 || width < 1) {
                addBotMessage(`Those dimensions (${length}' x ${width}') seem unusual for a ${currentRoom.name}. Could you please confirm or provide different measurements?`);
                return;
            }

            // Update current room
            currentRoom.dimensions = {
                length,
                width,
                squareFootage,
                unit: 'feet'
            };

            // Check if there are more rooms to process
            if (chatbotState.currentRoomIndex < chatbotState.rooms.length - 1) {
                // Move to next room
                chatbotState.currentRoomIndex++;
                const nextRoom = chatbotState.rooms[chatbotState.currentRoomIndex];

                addBotMessage(`Got it! A ${length}' x ${width}' ${currentRoom.name} (${squareFootage} sq ft).\n\nNow, what are the dimensions of your ${nextRoom.name}? Please provide the length and width or total square footage.`);
            } else {
                // All rooms processed, move to budget stage
                chatbotState.stage = ConversationStage.BUDGET;

                // Calculate total square footage for all rooms
                const totalSqFt = chatbotState.rooms.reduce((total, room) => {
                    return total + (room.dimensions?.squareFootage || 0);
                }, 0);

                addBotMessage(`Got it! A ${length}' x ${width}' ${currentRoom.name} (${squareFootage} sq ft).\n\nYour total project area is ${totalSqFt} sq ft.\n\nNow, let's talk about your budget. What's your budget range for this project? You can provide a specific amount (e.g., "$15,000"), a range (e.g., "$10,000-$20,000"), or a general description (e.g., "modest" or "high-end").`);
            }
        } else if (squareFootageMatch) {
            // Extract square footage directly
            const squareFootage = parseInt(squareFootageMatch[1]);

            // Validate square footage (basic sanity check)
            if (squareFootage > 10000 || squareFootage < 10) {
                addBotMessage(`${squareFootage} square feet seems unusual for a ${currentRoom.name}. Could you please confirm or provide a different measurement?`);
                return;
            }

            // Update current room
            currentRoom.dimensions = {
                squareFootage,
                unit: 'feet'
            };

            // Check if there are more rooms to process
            if (chatbotState.currentRoomIndex < chatbotState.rooms.length - 1) {
                // Move to next room
                chatbotState.currentRoomIndex++;
                const nextRoom = chatbotState.rooms[chatbotState.currentRoomIndex];

                addBotMessage(`Got it! A ${squareFootage} sq ft ${currentRoom.name}.\n\nNow, what are the dimensions of your ${nextRoom.name}? Please provide the length and width or total square footage.`);
            } else {
                // All rooms processed, move to budget stage
                chatbotState.stage = ConversationStage.BUDGET;

                // Calculate total square footage for all rooms
                const totalSqFt = chatbotState.rooms.reduce((total, room) => {
                    return total + (room.dimensions?.squareFootage || 0);
                }, 0);

                addBotMessage(`Got it! A ${squareFootage} sq ft ${currentRoom.name}.\n\nYour total project area is ${totalSqFt} sq ft.\n\nNow, let's talk about your budget. What's your budget range for this project? You can provide a specific amount (e.g., "$15,000"), a range (e.g., "$10,000-$20,000"), or a general description (e.g., "modest" or "high-end").`);
            }
        } else if (singleDimensionMatch && !lowerMessage.includes('ceiling') && !lowerMessage.includes('height')) {
            // User might be giving just one dimension, ask for clarification
            const dimension = parseInt(singleDimensionMatch[1]);

            addBotMessage(`I see you mentioned ${dimension} feet. To calculate costs accurately, I need both the length and width of the ${currentRoom.name}. For example, you could say "10 feet by 12 feet" or provide the total area like "120 square feet".`);
        } else if (lowerMessage.includes('small') || lowerMessage.includes('medium') || lowerMessage.includes('large')) {
            // Handle descriptive sizes
            let squareFootage;
            let sizeDescription;

            if (lowerMessage.includes('small')) {
                sizeDescription = "small";
                squareFootage = currentRoom.type === RoomType.BATHROOM ? 40 :
                               currentRoom.type === RoomType.KITCHEN ? 100 :
                               currentRoom.type === RoomType.BEDROOM ? 120 : 150;
            } else if (lowerMessage.includes('medium')) {
                sizeDescription = "medium";
                squareFootage = currentRoom.type === RoomType.BATHROOM ? 60 :
                               currentRoom.type === RoomType.KITCHEN ? 150 :
                               currentRoom.type === RoomType.BEDROOM ? 180 : 250;
            } else { // large
                sizeDescription = "large";
                squareFootage = currentRoom.type === RoomType.BATHROOM ? 80 :
                               currentRoom.type === RoomType.KITCHEN ? 200 :
                               currentRoom.type === RoomType.BEDROOM ? 250 : 350;
            }

            // Update current room
            currentRoom.dimensions = {
                squareFootage,
                unit: 'feet',
                isEstimate: true,
                sizeDescription
            };

            // Check if there are more rooms to process
            if (chatbotState.currentRoomIndex < chatbotState.rooms.length - 1) {
                // Move to next room
                chatbotState.currentRoomIndex++;
                const nextRoom = chatbotState.rooms[chatbotState.currentRoomIndex];

                addBotMessage(`Based on your description of a ${sizeDescription} ${currentRoom.name}, I'll estimate it at approximately ${squareFootage} sq ft.\n\nNow, what are the dimensions of your ${nextRoom.name}? You can provide exact measurements or describe it as small, medium, or large.`);
            } else {
                // All rooms processed, move to budget stage
                chatbotState.stage = ConversationStage.BUDGET;

                // Calculate total square footage for all rooms
                const totalSqFt = chatbotState.rooms.reduce((total, room) => {
                    return total + (room.dimensions?.squareFootage || 0);
                }, 0);

                addBotMessage(`Based on your description of a ${sizeDescription} ${currentRoom.name}, I'll estimate it at approximately ${squareFootage} sq ft.\n\nYour total project area is ${totalSqFt} sq ft.\n\nNow, let's talk about your budget. What's your budget range for this project? You can provide a specific amount (e.g., "$15,000"), a range (e.g., "$10,000-$20,000"), or a general description (e.g., "modest" or "high-end").`);
            }
        } else {
            // Couldn't determine dimensions
            addBotMessage(`I need the dimensions of your ${currentRoom.name} to calculate costs accurately. Please provide:\n\n- Length and width (e.g., "10 feet by 12 feet" or "10x12")\n- OR total square footage (e.g., "120 square feet")\n- OR a general size description (small, medium, or large)`);
        }
    }

    function handleBudget(message) {
        const lowerMessage = message.toLowerCase();
        console.log(`handleBudget called with message: "${message}"`);

        // Validate that we have rooms before proceeding
        if (chatbotState.rooms.length === 0) {
            console.error("No rooms defined in handleBudget");
            // Reset to greeting stage if we're in an invalid state
            chatbotState.stage = ConversationStage.GREETING;
            addBotMessage("I'm sorry, but I seem to have lost track of our conversation. Let's start over. What kind of remodeling project are you planning?");
            return;
        }

        // Calculate total square footage for all rooms
        const totalSqFt = chatbotState.rooms.reduce((total, room) => {
            return total + (room.dimensions?.squareFootage || 0);
        }, 0);

        // First, check if the message contains clear budget indicators
        const hasDollarSign = lowerMessage.includes('$');
        const hasBudgetKeyword = lowerMessage.includes('budget') ||
                                lowerMessage.includes('spend') ||
                                lowerMessage.includes('cost') ||
                                lowerMessage.includes('afford') ||
                                lowerMessage.includes('thousand') ||
                                lowerMessage.includes('k');

        // Check for descriptive budget terms
        const budgetDescriptorMatch = lowerMessage.match(/(low|tight|limited|small|modest|medium|average|high|large|luxury|premium|expensive|unlimited)/i);
        const hasBudgetDescriptor = budgetDescriptorMatch !== null;

        // Check for dimension indicators
        const hasDimensionKeyword = lowerMessage.includes('feet') ||
                                   lowerMessage.includes('ft') ||
                                   lowerMessage.includes('square') ||
                                   lowerMessage.includes('sq') ||
                                   lowerMessage.includes('dimensions') ||
                                   lowerMessage.includes('size') ||
                                   lowerMessage.includes('length') ||
                                   lowerMessage.includes('width') ||
                                   lowerMessage.includes('by') ||
                                   lowerMessage.includes('x');

        const dimensionsRegex = /(\d+)\s*(?:x|by|×)\s*(\d+)/i;
        const hasDimensionFormat = dimensionsRegex.test(lowerMessage);

        // If the message clearly looks like dimensions and not budget
        if ((hasDimensionKeyword || hasDimensionFormat) &&
            !hasDollarSign && !hasBudgetKeyword && !hasBudgetDescriptor) {

            // User might be trying to provide dimensions information instead of budget
            addBotMessage("I see you might be providing room dimensions, but we've already recorded those. Now I need to know your budget for this project. This helps me recommend appropriate materials and finishes. Please provide your budget range (e.g., \"$10,000-$15,000\") or a general budget description (e.g., \"modest\" or \"high-end\").");
            return;
        }

        // Regular expressions for different budget formats
        const budgetRangeRegex = /\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\s*-\s*|\s*to\s*)\$?(\d{1,3}(?:,\d{3})*|\d+)/i;
        const singleBudgetRegex = /\$?(\d{1,3}(?:,\d{3})*|\d+)/i;

        // Try to match different formats
        const budgetRangeMatch = lowerMessage.match(budgetRangeRegex);

        // Process budget range (e.g., $10,000-$15,000)
        if (budgetRangeMatch) {
            console.log("Matched budget range format");
            // Extract min and max budget
            const min = parseInt(budgetRangeMatch[1].replace(/,/g, ''));
            const max = parseInt(budgetRangeMatch[2].replace(/,/g, ''));

            // Validate budget (basic sanity check)
            if (min < 1000 || max < 1000) {
                addBotMessage(`A budget of $${min.toLocaleString()}-$${max.toLocaleString()} seems quite low for a remodeling project of this size. Did you mean thousand dollars? For example, $5,000-$10,000?`);
                return;
            }

            if (min > 1000000 || max > 1000000) {
                addBotMessage(`A budget of $${min.toLocaleString()}-$${max.toLocaleString()} is extremely high for a typical remodeling project. Did you mean to enter a different amount?`);
                return;
            }

            // Store budget in state
            chatbotState.budget = {
                min,
                max,
                perSqFt: Math.round((min + max) / (2 * totalSqFt))
            };

            // Move to next stage
            chatbotState.stage = ConversationStage.DESIGN_PREFERENCES;

            // Provide feedback based on budget per square foot
            let budgetFeedback = '';
            if (chatbotState.budget.perSqFt < 100) {
                budgetFeedback = "This is a modest budget for the size of your project, but we can work with it by focusing on cost-effective materials and solutions.";
            } else if (chatbotState.budget.perSqFt > 300) {
                budgetFeedback = "This is a generous budget that will allow for high-quality materials and premium finishes.";
            } else {
                budgetFeedback = "This is a reasonable budget for your project size.";
            }

            addBotMessage(`A budget of $${min.toLocaleString()}-$${max.toLocaleString()} works for this project. ${budgetFeedback}\n\nNow, let's talk about design preferences. What style are you interested in for your ${chatbotState.rooms[0].name}? For example:\n\n- Modern (clean lines, minimalist)\n- Traditional (classic, timeless)\n- Farmhouse (rustic, country charm)\n- Contemporary (current trends)\n- Industrial (raw, factory-inspired)\n\nYou can also mention any specific colors or materials you prefer.`);
            return;
        }

        // Process descriptive budget terms (e.g., "modest", "high-end")
        if (hasBudgetDescriptor) {
            console.log("Matched budget descriptor format");
            const budgetKeyword = budgetDescriptorMatch[1].toLowerCase();
            let min, max;

            // Set budget ranges based on keywords and project size
            if (budgetKeyword === 'low' || budgetKeyword === 'tight' || budgetKeyword === 'limited' || budgetKeyword === 'small' || budgetKeyword === 'modest') {
                min = totalSqFt * 75;
                max = totalSqFt * 125;
            } else if (budgetKeyword === 'medium' || budgetKeyword === 'average') {
                min = totalSqFt * 125;
                max = totalSqFt * 225;
            } else { // high, large, luxury, premium, expensive, unlimited
                min = totalSqFt * 225;
                max = totalSqFt * 400;
            }

            // Round to nice numbers
            min = Math.round(min / 1000) * 1000;
            max = Math.round(max / 1000) * 1000;

            // Ensure minimum values
            min = Math.max(min, 5000);
            max = Math.max(max, 10000);

            // Store budget in state
            chatbotState.budget = {
                min,
                max,
                keyword: budgetKeyword,
                perSqFt: Math.round((min + max) / (2 * totalSqFt))
            };

            // Move to next stage
            chatbotState.stage = ConversationStage.DESIGN_PREFERENCES;

            addBotMessage(`Based on your ${budgetKeyword} budget description and project size, I'll estimate a budget range of $${min.toLocaleString()}-$${max.toLocaleString()}. We can adjust this later if needed.\n\nNow, let's talk about design preferences. What style are you interested in for your ${chatbotState.rooms[0].name}? For example:\n\n- Modern (clean lines, minimalist)\n- Traditional (classic, timeless)\n- Farmhouse (rustic, country charm)\n- Contemporary (current trends)\n- Industrial (raw, factory-inspired)\n\nYou can also mention any specific colors or materials you prefer.`);
            return;
        }

        // Process single budget amount (e.g., "$10,000")
        // Only if it doesn't look like dimensions
        const singleBudgetMatch = lowerMessage.match(singleBudgetRegex);
        if (singleBudgetMatch &&
            (hasDollarSign || hasBudgetKeyword || !hasDimensionKeyword) &&
            !hasDimensionFormat) {

            console.log("Matched single budget format");
            // Extract single budget amount
            const budget = parseInt(singleBudgetMatch[1].replace(/,/g, ''));

            // Validate budget (basic sanity check)
            if (budget < 1000) {
                addBotMessage(`A budget of $${budget.toLocaleString()} seems quite low for a remodeling project of this size. Did you mean thousand dollars? For example, $5,000?`);
                return;
            }

            if (budget > 1000000) {
                addBotMessage(`A budget of $${budget.toLocaleString()} is extremely high for a typical remodeling project. Did you mean to enter a different amount?`);
                return;
            }

            // Create a range around the single value
            const min = Math.floor(budget * 0.8);
            const max = Math.ceil(budget * 1.2);

            // Store budget in state
            chatbotState.budget = {
                min,
                max,
                target: budget,
                perSqFt: Math.round(budget / totalSqFt)
            };

            // Move to next stage
            chatbotState.stage = ConversationStage.DESIGN_PREFERENCES;

            // Provide feedback based on budget per square foot
            let budgetFeedback = '';
            if (chatbotState.budget.perSqFt < 100) {
                budgetFeedback = "This is a modest budget for the size of your project, but we can work with it by focusing on cost-effective materials and solutions.";
            } else if (chatbotState.budget.perSqFt > 300) {
                budgetFeedback = "This is a generous budget that will allow for high-quality materials and premium finishes.";
            } else {
                budgetFeedback = "This is a reasonable budget for your project size.";
            }

            addBotMessage(`A budget of around $${budget.toLocaleString()} works for this project. I'll consider a range of $${min.toLocaleString()}-$${max.toLocaleString()}. ${budgetFeedback}\n\nNow, let's talk about design preferences. What style are you interested in for your ${chatbotState.rooms[0].name}? For example:\n\n- Modern (clean lines, minimalist)\n- Traditional (classic, timeless)\n- Farmhouse (rustic, country charm)\n- Contemporary (current trends)\n- Industrial (raw, factory-inspired)\n\nYou can also mention any specific colors or materials you prefer.`);
            return;
        }

        // Couldn't determine budget
        console.log("Could not determine budget format");
        addBotMessage("To provide accurate recommendations, I need to know your budget. Please provide:\n\n- A budget range (e.g., \"$5,000-$10,000\")\n- A target budget (e.g., \"$7,500\")\n- OR a general description (e.g., \"modest\", \"average\", or \"high-end\")\n\nThis helps me suggest appropriate materials and finishes for your project.");
    }

    function handleDesignPreferences(message) {
        const lowerMessage = message.toLowerCase();

        // Check if message looks like budget or dimensions instead of design preferences
        if ((lowerMessage.includes('$') || lowerMessage.includes('dollar') || lowerMessage.includes('budget')) &&
            !lowerMessage.includes('style') && !lowerMessage.includes('design') && !lowerMessage.includes('look')) {
            // User might be trying to provide budget information instead of design preferences
            addBotMessage("I see you might be mentioning your budget, but we've already recorded that. Now I need to know your design preferences. What style are you interested in? For example: modern, traditional, farmhouse, etc. You can also mention colors and materials you like.");
            return;
        }

        if (lowerMessage.includes('feet') || lowerMessage.includes('ft') || lowerMessage.includes('square') ||
            lowerMessage.includes('dimensions') || lowerMessage.includes('size')) {
            // User might be trying to provide dimensions information instead of design preferences
            addBotMessage("I see you might be mentioning dimensions, but we've already recorded those. Now I need to know your design preferences. What style are you interested in? For example: modern, traditional, farmhouse, etc. You can also mention colors and materials you like.");
            return;
        }

        // Detect design style with more comprehensive matching
        let designStyle = null;

        // Check for specific design styles
        const styleMatches = {
            [DesignStyle.MODERN]: ['modern', 'sleek', 'clean lines', 'minimalist', 'contemporary'],
            [DesignStyle.TRADITIONAL]: ['traditional', 'classic', 'timeless', 'elegant'],
            [DesignStyle.CONTEMPORARY]: ['contemporary', 'current', 'present-day'],
            [DesignStyle.FARMHOUSE]: ['farmhouse', 'rustic', 'country', 'barn', 'shiplap'],
            [DesignStyle.INDUSTRIAL]: ['industrial', 'factory', 'warehouse', 'metal', 'pipes', 'exposed'],
            [DesignStyle.MINIMALIST]: ['minimalist', 'simple', 'clean', 'uncluttered', 'minimal'],
            [DesignStyle.RUSTIC]: ['rustic', 'natural', 'weathered', 'distressed', 'reclaimed'],
            [DesignStyle.TRANSITIONAL]: ['transitional', 'blend', 'mix', 'balance']
        };

        // Find the style with the most matches
        let bestMatchCount = 0;
        let bestMatchStyle = DesignStyle.MODERN; // Default

        Object.entries(styleMatches).forEach(([style, keywords]) => {
            const matchCount = keywords.reduce((count, keyword) => {
                return count + (lowerMessage.includes(keyword) ? 1 : 0);
            }, 0);

            if (matchCount > bestMatchCount) {
                bestMatchCount = matchCount;
                bestMatchStyle = style;
            }
        });

        // If no style keywords found, ask for clarification
        if (bestMatchCount === 0 &&
            !lowerMessage.includes('color') &&
            !lowerMessage.includes('material') &&
            !lowerMessage.includes('finish')) {
            addBotMessage("I'm not sure which design style you're interested in. Could you please specify a style like modern, traditional, farmhouse, contemporary, industrial, etc.? This helps me recommend appropriate products and finishes.");
            return;
        }

        designStyle = bestMatchStyle;

        // Store design style in state
        chatbotState.preferences.designStyle = designStyle;

        // Extract color preferences with expanded list
        const colorRegex = /(white|black|gray|grey|blue|green|red|yellow|brown|beige|cream|navy|teal|purple|pink|orange|silver|gold|bronze|copper|tan|ivory|charcoal|slate)/gi;
        const colorMatches = lowerMessage.match(colorRegex);

        if (colorMatches) {
            chatbotState.preferences.colorPreferences = Array.from(new Set(colorMatches.map(c => c.toLowerCase())));
        }

        // Extract material preferences with expanded list
        const materialRegex = /(wood|marble|granite|quartz|tile|ceramic|porcelain|glass|metal|steel|brass|copper|concrete|laminate|vinyl|hardwood|oak|maple|pine|cherry|bamboo|cork|stone|brick|stainless|acrylic|composite|engineered)/gi;
        const materialMatches = lowerMessage.match(materialRegex);

        if (materialMatches) {
            chatbotState.preferences.materialPreferences = Array.from(new Set(materialMatches.map(m => m.toLowerCase())));
        }

        // Extract additional preferences
        chatbotState.preferences.additionalPreferences = [];

        if (lowerMessage.includes('eco') || lowerMessage.includes('sustainable') || lowerMessage.includes('green')) {
            chatbotState.preferences.additionalPreferences.push('eco-friendly');
        }

        if (lowerMessage.includes('low maintenance') || lowerMessage.includes('easy to clean')) {
            chatbotState.preferences.additionalPreferences.push('low-maintenance');
        }

        if (lowerMessage.includes('durable') || lowerMessage.includes('long lasting')) {
            chatbotState.preferences.additionalPreferences.push('durable');
        }

        // Move to next stage
        chatbotState.stage = ConversationStage.PRODUCT_SUGGESTIONS;

        // Generate product recommendations based on room type and preferences
        const productRecommendations = generateProductRecommendations();

        // Format product recommendations for display
        let productsText = '';
        productRecommendations.forEach((product, index) => {
            productsText += `${index + 1}. ${product.name} - $${product.price.toLocaleString()}\n   ${product.description}\n\n`;
        });

        // Store product suggestions in state
        chatbotState.productSuggestions = productRecommendations;

        // Format response based on detected preferences
        let preferencesText = '';
        if (chatbotState.preferences.colorPreferences.length > 0) {
            preferencesText += ` with ${chatbotState.preferences.colorPreferences.join(' and ')} colors`;
        }

        if (chatbotState.preferences.materialPreferences.length > 0) {
            preferencesText += ` and ${chatbotState.preferences.materialPreferences.join('/')} materials`;
        }

        // Add additional preferences if any
        if (chatbotState.preferences.additionalPreferences.length > 0) {
            preferencesText += `. I've also noted your preference for ${chatbotState.preferences.additionalPreferences.join(' and ')} options`;
        }

        // Customize message based on room type
        let roomSpecificMessage = '';
        if (chatbotState.rooms[0].type === RoomType.KITCHEN) {
            roomSpecificMessage = "For kitchens, I've included options for cabinets, countertops, and flooring that match your style.";
        } else if (chatbotState.rooms[0].type === RoomType.BATHROOM) {
            roomSpecificMessage = "For bathrooms, I've included options for vanities, shower systems, and tile that complement your style.";
        } else if (chatbotState.rooms[0].type === RoomType.LIVING_ROOM) {
            roomSpecificMessage = "For living rooms, I've focused on flooring, wall treatments, and trim options that match your aesthetic.";
        }

        addBotMessage(`I love the ${designStyle} style${preferencesText}! ${roomSpecificMessage}\n\nBased on your preferences and budget, here are some product recommendations for your ${chatbotState.rooms[0].name}:\n\n${productsText}Would you like to add any of these products to your estimate? You can say "yes" to add all, "no" to skip all, or specify which ones (e.g., "add products 1 and 3").`);
    }

    // Helper function to generate product recommendations based on room type and preferences
    function generateProductRecommendations() {
        const room = chatbotState.rooms[0];
        const style = chatbotState.preferences.designStyle;
        const colors = chatbotState.preferences.colorPreferences;
        const materials = chatbotState.preferences.materialPreferences;
        const budget = chatbotState.budget;

        // Default color and material if none specified
        const primaryColor = colors.length > 0 ? colors[0] : 'white';
        const primaryMaterial = materials.length > 0 ? materials[0] : 'wood';

        // Budget tier (low, medium, high)
        let budgetTier = 'medium';
        if (budget.perSqFt < 100) {
            budgetTier = 'low';
        } else if (budget.perSqFt > 250) {
            budgetTier = 'high';
        }

        // Product recommendations based on room type
        const products = [];

        if (room.type === RoomType.KITCHEN) {
            // Kitchen products
            if (style === DesignStyle.MODERN || style === DesignStyle.CONTEMPORARY || style === DesignStyle.MINIMALIST) {
                products.push({
                    id: 'cab-001',
                    name: 'Sleek Flat-Panel Cabinets',
                    brand: 'Home Depot',
                    category: 'cabinets',
                    price: budgetTier === 'low' ? 3500 : (budgetTier === 'medium' ? 5000 : 8000),
                    description: `Modern ${primaryColor} cabinets with minimalist hardware and clean lines`
                });

                products.push({
                    id: 'count-001',
                    name: 'Quartz Countertop',
                    brand: 'Home Depot',
                    category: 'countertops',
                    price: budgetTier === 'low' ? 2800 : (budgetTier === 'medium' ? 3500 : 5000),
                    description: `Sleek ${colors.includes('white') ? 'white' : 'gray'} quartz countertop with subtle veining`
                });
            } else if (style === DesignStyle.FARMHOUSE || style === DesignStyle.RUSTIC) {
                products.push({
                    id: 'cab-002',
                    name: 'Shaker Style Cabinets',
                    brand: 'Home Depot',
                    category: 'cabinets',
                    price: budgetTier === 'low' ? 3200 : (budgetTier === 'medium' ? 4500 : 7000),
                    description: `Classic ${primaryColor} shaker cabinets with farmhouse appeal`
                });

                products.push({
                    id: 'count-002',
                    name: 'Butcher Block Countertop',
                    brand: 'Home Depot',
                    category: 'countertops',
                    price: budgetTier === 'low' ? 1800 : (budgetTier === 'medium' ? 2500 : 3800),
                    description: `Warm ${primaryMaterial === 'wood' ? 'oak' : 'walnut'} butcher block for a rustic feel`
                });
            } else {
                products.push({
                    id: 'cab-003',
                    name: 'Traditional Raised-Panel Cabinets',
                    brand: 'Home Depot',
                    category: 'cabinets',
                    price: budgetTier === 'low' ? 3800 : (budgetTier === 'medium' ? 5500 : 8500),
                    description: `Elegant ${primaryColor} cabinets with detailed craftsmanship`
                });

                products.push({
                    id: 'count-003',
                    name: 'Granite Countertop',
                    brand: 'Home Depot',
                    category: 'countertops',
                    price: budgetTier === 'low' ? 2500 : (budgetTier === 'medium' ? 3200 : 4800),
                    description: `Classic ${colors.includes('black') ? 'black' : 'brown'} granite with natural patterns`
                });
            }

            // Add flooring for all kitchen styles
            products.push({
                id: 'floor-001',
                name: 'Luxury Vinyl Plank Flooring',
                brand: 'Home Depot',
                category: 'flooring',
                price: budgetTier === 'low' ? 1500 : (budgetTier === 'medium' ? 2200 : 3500),
                description: `Durable ${primaryColor === 'white' ? 'light oak' : 'medium brown'} waterproof vinyl planks with ${primaryMaterial} appearance`
            });
        } else if (room.type === RoomType.BATHROOM) {
            // Bathroom products
            if (style === DesignStyle.MODERN || style === DesignStyle.CONTEMPORARY) {
                products.push({
                    id: 'van-001',
                    name: 'Floating Vanity',
                    brand: 'Home Depot',
                    category: 'vanities',
                    price: budgetTier === 'low' ? 800 : (budgetTier === 'medium' ? 1200 : 2500),
                    description: `Wall-mounted ${primaryColor} vanity with integrated sink and soft-close drawers`
                });

                products.push({
                    id: 'shower-001',
                    name: 'Frameless Glass Shower',
                    brand: 'Home Depot',
                    category: 'showers',
                    price: budgetTier === 'low' ? 1200 : (budgetTier === 'medium' ? 1800 : 3000),
                    description: 'Sleek frameless glass shower enclosure with chrome hardware'
                });
            } else {
                products.push({
                    id: 'van-002',
                    name: 'Traditional Vanity',
                    brand: 'Home Depot',
                    category: 'vanities',
                    price: budgetTier === 'low' ? 700 : (budgetTier === 'medium' ? 1100 : 2200),
                    description: `Classic ${primaryColor} vanity with ${primaryMaterial} top and decorative hardware`
                });

                products.push({
                    id: 'shower-002',
                    name: 'Tiled Shower System',
                    brand: 'Home Depot',
                    category: 'showers',
                    price: budgetTier === 'low' ? 1500 : (budgetTier === 'medium' ? 2200 : 3500),
                    description: `Custom ${primaryColor} tile shower with ${materials.includes('glass') ? 'glass accent tiles' : 'decorative border'}`
                });
            }

            // Add flooring for all bathroom styles
            products.push({
                id: 'tile-001',
                name: 'Porcelain Floor Tile',
                brand: 'Home Depot',
                category: 'flooring',
                price: budgetTier === 'low' ? 800 : (budgetTier === 'medium' ? 1200 : 2000),
                description: `${primaryColor} porcelain tiles with ${style === DesignStyle.MODERN ? 'minimal' : 'natural'} pattern`
            });
        } else {
            // Generic products for other room types
            products.push({
                id: 'paint-001',
                name: 'Premium Interior Paint',
                brand: 'Home Depot',
                category: 'paint',
                price: budgetTier === 'low' ? 300 : (budgetTier === 'medium' ? 500 : 800),
                description: `High-quality ${primaryColor} paint with primer included`
            });

            products.push({
                id: 'floor-002',
                name: 'Engineered Hardwood Flooring',
                brand: 'Home Depot',
                category: 'flooring',
                price: budgetTier === 'low' ? 2000 : (budgetTier === 'medium' ? 3000 : 4500),
                description: `Beautiful ${primaryMaterial === 'wood' ? primaryMaterial : 'oak'} engineered hardwood with easy installation`
            });

            products.push({
                id: 'trim-001',
                name: 'Decorative Trim Package',
                brand: 'Home Depot',
                category: 'trim',
                price: budgetTier === 'low' ? 600 : (budgetTier === 'medium' ? 900 : 1500),
                description: `Complete ${primaryColor} trim package including baseboards, crown molding, and door casings`
            });
        }

        return products;
    }

    function handleProductSuggestions(message) {
        const lowerMessage = message.toLowerCase();

        // Check if user wants to add products to estimate
        const addProductsRegex = /(yes|add|include|want|like|sure|ok|okay|all|everything)/i;
        const rejectProductsRegex = /(no|don't|dont|not|none|neither|skip)/i;

        const addMatch = lowerMessage.match(addProductsRegex);
        const rejectMatch = lowerMessage.match(rejectProductsRegex);

        // Check for specific product numbers
        const productNumbersRegex = /(?:add|include|want|like|get|choose)\s+(?:product|item|number|#)?\s*(?:#?\s*(\d+)(?:\s*,\s*#?\s*(\d+))?(?:\s*,\s*#?\s*(\d+))?(?:\s*,\s*#?\s*(\d+))?)/i;
        const productNumbersMatch = lowerMessage.match(productNumbersRegex);

        // Selected products array
        let selectedProducts = [];

        if (productNumbersMatch) {
            // User specified product numbers
            const productNumbers = [];
            for (let i = 1; i < productNumbersMatch.length; i++) {
                if (productNumbersMatch[i]) {
                    productNumbers.push(parseInt(productNumbersMatch[i]));
                }
            }

            // Add selected products
            productNumbers.forEach(num => {
                if (num > 0 && num <= chatbotState.productSuggestions.length) {
                    selectedProducts.push(chatbotState.productSuggestions[num - 1]);
                }
            });
        } else if (addMatch && !rejectMatch) {
            // User wants all products
            selectedProducts = [...chatbotState.productSuggestions];
        } else if (rejectMatch && !addMatch) {
            // User doesn't want any products
            selectedProducts = [];
        } else {
            // Unclear response, ask for clarification
            addBotMessage("I'm not sure which products you'd like to include. Please specify if you want to add all products, specific products (e.g., 'add products 1 and 3'), or none.");
            return;
        }

        // Store selected products
        chatbotState.selectedProducts = selectedProducts;

        // Calculate labor costs based on room type and square footage
        calculateLaborCosts();

        // Move to summary stage
        chatbotState.stage = ConversationStage.SUMMARY;

        // Generate and display summary
        const summary = generateProjectSummary();
        addBotMessage(summary);

        // Show save prompt
        savePrompt.style.display = 'flex';
    }

    // Calculate labor costs based on room type and square footage
    function calculateLaborCosts() {
        // Reset labor costs
        chatbotState.laborCosts = [];

        // Calculate for each room
        chatbotState.rooms.forEach(room => {
            const squareFootage = room.dimensions?.squareFootage || 100;

            // Base labor rates from the requirements
            const laborRates = {
                framing: { min: 3.25, max: 3.75 },
                drywall: { min: 1.90, max: 2.25 },
                paint: { min: 0.95, max: 1.10 },
                flooring: { min: 1.75, max: 2.50 },
                insulation: { min: 1.00, max: 1.50 },
                trim: { min: 1.50, max: 2.25 },
                tile: { min: 10.00, max: 15.00 },
                ceiling: { min: 1.50, max: 2.25 },
                paintTouchup: { min: 1.00, max: 1.20 }
            };

            // Hourly rates
            const hourlyRates = {
                general: { min: 60, max: 75 },
                specialized: { min: 85, max: 120 }
            };

            // Labor costs for this room
            const roomLaborCosts = [];

            // Add labor costs based on room type
            if (room.type === RoomType.KITCHEN) {
                // Kitchen-specific labor
                roomLaborCosts.push({
                    name: 'Demolition',
                    cost: squareFootage * 10,
                    description: 'Removal of existing cabinets, countertops, and flooring'
                });

                roomLaborCosts.push({
                    name: 'Cabinet Installation',
                    cost: squareFootage * 15,
                    description: 'Installation of new cabinets and hardware'
                });

                roomLaborCosts.push({
                    name: 'Countertop Installation',
                    cost: squareFootage * 12,
                    description: 'Fabrication and installation of countertops'
                });

                roomLaborCosts.push({
                    name: 'Plumbing',
                    cost: 800,
                    description: 'Sink and faucet installation, connections'
                });

                roomLaborCosts.push({
                    name: 'Electrical',
                    cost: 1200,
                    description: 'Lighting, outlets, and appliance connections'
                });

                roomLaborCosts.push({
                    name: 'Flooring Installation',
                    cost: squareFootage * laborRates.flooring.max,
                    description: 'Installation of new flooring'
                });

                roomLaborCosts.push({
                    name: 'Backsplash Installation',
                    cost: 1500,
                    description: 'Tile backsplash installation'
                });

                roomLaborCosts.push({
                    name: 'Finishing Work',
                    cost: squareFootage * 5,
                    description: 'Trim, caulking, and final touches'
                });
            } else if (room.type === RoomType.BATHROOM) {
                // Bathroom-specific labor
                roomLaborCosts.push({
                    name: 'Demolition',
                    cost: squareFootage * 12,
                    description: 'Removal of existing fixtures, tile, and flooring'
                });

                roomLaborCosts.push({
                    name: 'Plumbing',
                    cost: 1800,
                    description: 'Fixture installation, supply lines, and drain work'
                });

                roomLaborCosts.push({
                    name: 'Electrical',
                    cost: 900,
                    description: 'Lighting, outlets, and ventilation'
                });

                roomLaborCosts.push({
                    name: 'Tile Installation',
                    cost: squareFootage * laborRates.tile.max,
                    description: 'Floor and wall tile installation'
                });

                roomLaborCosts.push({
                    name: 'Vanity Installation',
                    cost: 600,
                    description: 'Vanity and countertop installation'
                });

                roomLaborCosts.push({
                    name: 'Shower/Tub Installation',
                    cost: 2000,
                    description: 'Shower or tub installation and waterproofing'
                });

                roomLaborCosts.push({
                    name: 'Finishing Work',
                    cost: squareFootage * 6,
                    description: 'Trim, caulking, and final touches'
                });
            } else {
                // General labor for other room types
                roomLaborCosts.push({
                    name: 'Demolition',
                    cost: squareFootage * 8,
                    description: 'Removal of existing materials'
                });

                roomLaborCosts.push({
                    name: 'Framing',
                    cost: squareFootage * laborRates.framing.max,
                    description: 'Wall framing and structural work'
                });

                roomLaborCosts.push({
                    name: 'Drywall',
                    cost: squareFootage * laborRates.drywall.max,
                    description: 'Drywall installation and finishing'
                });

                roomLaborCosts.push({
                    name: 'Painting',
                    cost: squareFootage * laborRates.paint.max,
                    description: 'Wall and ceiling painting'
                });

                roomLaborCosts.push({
                    name: 'Flooring Installation',
                    cost: squareFootage * laborRates.flooring.max,
                    description: 'Installation of new flooring'
                });

                roomLaborCosts.push({
                    name: 'Trim Work',
                    cost: squareFootage * laborRates.trim.max,
                    description: 'Baseboards, crown molding, and door casings'
                });

                roomLaborCosts.push({
                    name: 'Finishing Work',
                    cost: squareFootage * 4,
                    description: 'Final touches and cleanup'
                });
            }

            // Add room labor costs to overall labor costs
            chatbotState.laborCosts.push({
                roomType: room.type,
                roomName: room.name,
                squareFootage: squareFootage,
                costs: roomLaborCosts,
                totalCost: roomLaborCosts.reduce((total, item) => total + item.cost, 0)
            });
        });

        // Calculate total labor cost
        const totalLaborCost = chatbotState.laborCosts.reduce((total, room) => total + room.totalCost, 0);

        // Calculate total product cost
        const totalProductCost = chatbotState.selectedProducts.reduce((total, product) => total + product.price, 0);

        // Calculate tax (assuming 8% sales tax on products)
        const tax = totalProductCost * 0.08;

        // Update total estimate
        chatbotState.totalEstimate = {
            productsCost: totalProductCost,
            laborCost: totalLaborCost,
            tax: tax,
            total: totalProductCost + totalLaborCost + tax
        };
    }

    // Generate a detailed project summary
    function generateProjectSummary() {
        // Project overview
        let summary = `# BuildSmart Project Estimate\n\n`;

        // Room details
        summary += `## Project Overview\n\n`;

        if (chatbotState.rooms.length === 1) {
            const room = chatbotState.rooms[0];
            summary += `Room: ${room.name.charAt(0).toUpperCase() + room.name.slice(1)}\n`;

            if (room.dimensions?.length && room.dimensions?.width) {
                summary += `Dimensions: ${room.dimensions.length}' x ${room.dimensions.width}' (${room.dimensions.squareFootage} sq ft)\n`;
            } else if (room.dimensions?.squareFootage) {
                summary += `Size: ${room.dimensions.squareFootage} sq ft\n`;
            }
        } else {
            summary += `Rooms:\n`;
            chatbotState.rooms.forEach(room => {
                summary += `- ${room.name.charAt(0).toUpperCase() + room.name.slice(1)}`;

                if (room.dimensions?.squareFootage) {
                    summary += ` (${room.dimensions.squareFootage} sq ft)`;
                }

                summary += `\n`;
            });

            // Calculate total square footage
            const totalSqFt = chatbotState.rooms.reduce((total, room) => {
                return total + (room.dimensions?.squareFootage || 0);
            }, 0);

            summary += `\nTotal Project Area: ${totalSqFt} sq ft\n`;
        }

        // Budget
        if (chatbotState.budget) {
            summary += `Budget Range: $${chatbotState.budget.min.toLocaleString()} - $${chatbotState.budget.max.toLocaleString()}\n`;
        }

        // Design preferences
        summary += `\n## Design Preferences\n\n`;

        if (chatbotState.preferences.designStyle) {
            summary += `Style: ${chatbotState.preferences.designStyle}\n`;
        }

        if (chatbotState.preferences.colorPreferences?.length) {
            summary += `Colors: ${chatbotState.preferences.colorPreferences.join(', ')}\n`;
        }

        if (chatbotState.preferences.materialPreferences?.length) {
            summary += `Materials: ${chatbotState.preferences.materialPreferences.join(', ')}\n`;
        }

        if (chatbotState.preferences.additionalPreferences?.length) {
            summary += `Additional Preferences: ${chatbotState.preferences.additionalPreferences.join(', ')}\n`;
        }

        // Products
        summary += `\n## Selected Products\n\n`;

        if (chatbotState.selectedProducts.length === 0) {
            summary += `No products selected.\n`;
        } else {
            chatbotState.selectedProducts.forEach(product => {
                summary += `- ${product.name} ($${product.price.toLocaleString()})\n  ${product.description}\n\n`;
            });

            summary += `Subtotal (Products): $${chatbotState.totalEstimate.productsCost.toLocaleString()}\n`;
            summary += `Sales Tax (8%): $${Math.round(chatbotState.totalEstimate.tax).toLocaleString()}\n`;
        }

        // Labor costs
        summary += `\n## Labor Costs\n\n`;

        chatbotState.laborCosts.forEach(roomLabor => {
            summary += `${roomLabor.roomName.charAt(0).toUpperCase() + roomLabor.roomName.slice(1)} Labor:\n`;

            roomLabor.costs.forEach(laborItem => {
                summary += `- ${laborItem.name}: $${laborItem.cost.toLocaleString()}\n`;
            });

            summary += `Subtotal (${roomLabor.roomName} Labor): $${roomLabor.totalCost.toLocaleString()}\n\n`;
        });

        summary += `Total Labor: $${chatbotState.totalEstimate.laborCost.toLocaleString()}\n`;

        // Total estimate
        summary += `\n## Total Estimate\n\n`;
        summary += `Products: $${chatbotState.totalEstimate.productsCost.toLocaleString()}\n`;
        summary += `Labor: $${chatbotState.totalEstimate.laborCost.toLocaleString()}\n`;
        summary += `Tax: $${Math.round(chatbotState.totalEstimate.tax).toLocaleString()}\n`;
        summary += `\nTotal Project Cost: $${Math.round(chatbotState.totalEstimate.total).toLocaleString()}\n`;

        // Check if within budget
        if (chatbotState.budget) {
            if (chatbotState.totalEstimate.total < chatbotState.budget.min) {
                summary += `\nThis estimate is under your minimum budget by $${(chatbotState.budget.min - chatbotState.totalEstimate.total).toLocaleString()}. You might consider upgrading some materials or adding additional features.\n`;
            } else if (chatbotState.totalEstimate.total > chatbotState.budget.max) {
                summary += `\nThis estimate exceeds your maximum budget by $${(chatbotState.totalEstimate.total - chatbotState.budget.max).toLocaleString()}. You might consider adjusting some selections to reduce costs.\n`;
            } else {
                summary += `\nThis estimate is within your specified budget range.\n`;
            }
        }

        // Next steps
        summary += `\nWould you like to save this estimate to your account?`;

        return summary;
    }

    function handleSummary(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('save') || lowerMessage.includes('yes')) {
            // User wants to save the estimate
            saveProject();
        } else if (lowerMessage.includes('change') || lowerMessage.includes('adjust') || lowerMessage.includes('modify')) {
            // User wants to make changes
            addBotMessage("What would you like to change about your estimate? You can adjust your budget, design preferences, or product selections.");
        } else if (lowerMessage.includes('start') || lowerMessage.includes('new')) {
            // User wants to start a new estimate
            resetChat();
            addBotMessage("Let's start a new estimate. What kind of remodeling project are you planning?");
        } else {
            // Default response
            addBotMessage("Your estimate is complete! You can save it to your account, make changes to your selections, or start a new estimate. What would you like to do?");
        }
    }

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'flex items-start space-x-3 justify-end';
        messageElement.innerHTML = `
            <div class="bg-slate-600 text-white p-3 rounded-lg rounded-br-none shadow-md max-w-xs sm:max-w-md lg:max-w-lg">
                <p class="text-sm sm:text-base">${message}</p>
                <div class="text-xs text-slate-300 mt-1 text-right">${getCurrentTime()}</div>
            </div>
            <div class="p-2 bg-slate-600 rounded-full text-white flex items-center justify-center w-10 h-10 flex-shrink-0 shadow-md">
                <i class="fas fa-user"></i>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'flex items-start space-x-3';
        messageElement.innerHTML = `
            <div class="p-2 bg-primary rounded-full text-white flex items-center justify-center w-10 h-10 flex-shrink-0 shadow-md">
                <i class="fas fa-robot"></i>
            </div>
            <div class="bg-primary text-white p-3 rounded-lg rounded-bl-none shadow-md max-w-xs sm:max-w-md lg:max-w-lg">
                <p class="text-sm sm:text-base whitespace-pre-line">${message}</p>
                <div class="text-xs text-blue-100 mt-1 text-right">${getCurrentTime()}</div>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'flex items-start space-x-3 typing-indicator';
        typingElement.innerHTML = `
            <div class="p-2 bg-primary rounded-full text-white flex items-center justify-center w-10 h-10 flex-shrink-0 shadow-md">
                <i class="fas fa-robot"></i>
            </div>
            <div class="bg-primary text-white p-3 rounded-lg rounded-bl-none shadow-md">
                <div class="flex space-x-2">
                    <div class="w-2 h-2 bg-blue-200 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-2 h-2 bg-blue-200 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-blue-200 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function toggleChatbot() {
        const isLaborCostBot = switchBotBtn.textContent.includes('Remodeling');

        if (isLaborCostBot) {
            switchBotBtn.innerHTML = '<i class="fas fa-exchange-alt mr-1"></i> Switch to Labor Cost Bot';
            chatMessages.innerHTML = '';
            chatbotState = {
                stage: 'greeting',
                rooms: [],
                currentRoomIndex: -1,
                budget: null,
                preferences: {},
                productSuggestions: []
            };
            initializeChat();
        } else {
            switchBotBtn.innerHTML = '<i class="fas fa-exchange-alt mr-1"></i> Switch to Remodeling Estimate Bot';
            chatMessages.innerHTML = '';
            addBotMessage("Hi there! I'm the Labor Cost Bot. I can help you calculate labor costs for your project. What type of work are you planning?");
        }
    }

    function saveProject() {
        if (userState.isLoggedIn) {
            // Mock saving project
            addBotMessage("Your project has been saved successfully! You can access it anytime from your projects dashboard.");
            savePrompt.style.display = 'none';
        } else {
            openAuthModal();
        }
    }

    function openAuthModal() {
        // Show modal
        authModal.classList.remove('hidden');

        // Trigger animations after a small delay to ensure the display change has taken effect
        setTimeout(() => {
            authModal.classList.add('active');
            authModal.style.opacity = '1';
            authModal.querySelector('.bg-slate-800').style.transform = 'scale(1)';
        }, 10);
    }

    function closeAuthModal() {
        // Start animations
        authModal.style.opacity = '0';
        authModal.querySelector('.bg-slate-800').style.transform = 'scale(0.95)';

        // Hide modal after animations complete
        setTimeout(() => {
            authModal.classList.remove('active');
            authModal.classList.add('hidden');
        }, 300);
    }

    function switchAuthTab(tab) {
        if (tab === 'signin') {
            signinTab.classList.add('active');
            signupTab.classList.remove('active');
            signinForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            signinTab.classList.remove('active');
            signupTab.classList.add('active');
            signinForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
    }

    function handleSignIn(e) {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        if (!email || !password) return;

        // Mock sign in
        userState.isLoggedIn = true;
        userState.email = email;

        // Update UI
        signInBtn.textContent = 'Account';
        document.getElementById('sign-in-prompt').style.display = 'none';

        closeAuthModal();

        // If save prompt is visible, save the project
        if (savePrompt.style.display === 'flex') {
            saveProject();
        }
    }

    function handleSignUp(e) {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        if (!email || !password || password !== confirmPassword) return;

        // Mock sign up
        alert('Account created! Please sign in.');
        switchAuthTab('signin');
    }

    // Email validation function
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show authentication error
    function showAuthError(formType, message) {
        const form = formType === 'signin' ? signinForm : signupForm;

        // Remove any existing error message
        const existingError = form.querySelector('.auth-error');
        if (existingError) {
            existingError.remove();
        }

        // Create and add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'auth-error text-red-500 text-sm mt-2';
        errorElement.textContent = message;

        // Add to form
        form.appendChild(errorElement);

        // Shake the form for visual feedback
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 500);
    }
});
