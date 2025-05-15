import { IUser, IEstimate, User, Estimate } from './database/mongodb/schemas';
import mongoose from 'mongoose';

// Create mock user
export const createMockUser = async (): Promise<IUser> => {
  try {
    // Check if mock user already exists
    const existingUser = await User.findOne({ email: 'demo@example.com' });
    
    if (existingUser) {
      console.log('Mock user already exists');
      return existingUser;
    }
    
    // Create new mock user
    const user = new User({
      email: 'demo@example.com',
      name: 'Demo User',
      phone: '555-123-4567',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      },
      created_at: new Date()
    });
    
    await user.save();
    console.log('Mock user created');
    return user;
  } catch (error) {
    console.error('Error creating mock user:', error);
    throw error;
  }
};

// Create mock estimate
export const createMockEstimate = async (userId: string): Promise<IEstimate> => {
  try {
    // Check if mock estimate already exists
    const existingEstimate = await Estimate.findOne({ user_id: userId });
    
    if (existingEstimate) {
      console.log('Mock estimate already exists');
      return existingEstimate;
    }
    
    // Create new mock estimate
    const estimate = new Estimate({
      user_id: userId,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
      rooms: [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Kitchen',
          type: 'kitchen',
          dimensions: {
            length: 12,
            width: 10,
            area: 120
          },
          labor_items: [
            {
              _id: new mongoose.Types.ObjectId(),
              trade_id: 1,
              description: 'Carpentry work',
              quantity: 120,
              unit: 'sq_ft',
              rate: 5.5,
              total: 660
            },
            {
              _id: new mongoose.Types.ObjectId(),
              trade_id: 2,
              description: 'Plumbing fixtures',
              quantity: 2,
              unit: 'fixture',
              rate: 85,
              total: 170
            }
          ],
          product_items: [
            {
              _id: new mongoose.Types.ObjectId(),
              product_id: 'HD456789',
              category_id: 19,
              name: 'Kitchen Cabinet Set',
              description: 'Shaker style, maple, 10-piece set',
              price: 2499,
              quantity: 1,
              total: 2499,
              source: 'home_depot',
              url: 'https://example.com/kitchen-cabinets',
              image_url: 'https://example.com/images/kitchen-cabinets.jpg'
            },
            {
              _id: new mongoose.Types.ObjectId(),
              product_id: 'LW567890',
              category_id: 5,
              name: 'Kitchen Faucet',
              description: 'Pull-down sprayer, stainless steel finish',
              price: 149,
              quantity: 1,
              total: 149,
              source: 'lowes',
              url: 'https://example.com/kitchen-faucet',
              image_url: 'https://example.com/images/kitchen-faucet.jpg'
            }
          ],
          photos: []
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Master Bathroom',
          type: 'bathroom',
          dimensions: {
            length: 8,
            width: 6,
            area: 48
          },
          labor_items: [
            {
              _id: new mongoose.Types.ObjectId(),
              trade_id: 6,
              description: 'Tile installation',
              quantity: 48,
              unit: 'sq_ft',
              rate: 12,
              total: 576
            }
          ],
          product_items: [
            {
              _id: new mongoose.Types.ObjectId(),
              product_id: 'HD234567',
              category_id: 23,
              name: 'Bathroom Vanity',
              description: '36-inch, white with marble top',
              price: 599,
              quantity: 1,
              total: 599,
              source: 'home_depot',
              url: 'https://example.com/bathroom-vanity',
              image_url: 'https://example.com/images/bathroom-vanity.jpg'
            },
            {
              _id: new mongoose.Types.ObjectId(),
              product_id: 'LW678901',
              category_id: 6,
              name: 'Toilet',
              description: 'Elongated bowl, comfort height, white',
              price: 189,
              quantity: 1,
              total: 189,
              source: 'lowes',
              url: 'https://example.com/toilet',
              image_url: 'https://example.com/images/toilet.jpg'
            }
          ],
          photos: []
        }
      ],
      conversation_history: [
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'system',
          content: 'Welcome to your estimate builder! How can I help you with your remodeling project today?',
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'user',
          content: 'I want to remodel my kitchen and master bathroom.',
          timestamp: new Date(Date.now() - 3500000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'assistant',
          content: 'Great! I can help you create an estimate for your kitchen and bathroom remodel. Let\'s start by getting some basic information about your spaces. What are the dimensions of your kitchen?',
          timestamp: new Date(Date.now() - 3400000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'user',
          content: 'My kitchen is about 12 feet by 10 feet.',
          timestamp: new Date(Date.now() - 3300000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'assistant',
          content: 'Thanks! And what about your master bathroom?',
          timestamp: new Date(Date.now() - 3200000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'user',
          content: 'The bathroom is smaller, about 8 feet by 6 feet.',
          timestamp: new Date(Date.now() - 3100000)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          role: 'assistant',
          content: 'Perfect. I\'ve added both rooms to your estimate. Now, let\'s talk about what you want to do in each space. For the kitchen, are you looking to replace cabinets, countertops, appliances, or all of the above?',
          timestamp: new Date(Date.now() - 3000000)
        }
      ],
      photos: [],
      totals: {
        labor: 1406,
        products: 3436,
        tax: 274.88,
        grand_total: 5116.88
      }
    });
    
    await estimate.save();
    console.log('Mock estimate created');
    return estimate;
  } catch (error) {
    console.error('Error creating mock estimate:', error);
    throw error;
  }
};

// Initialize mock data
export const initMockData = async (): Promise<void> => {
  try {
    const user = await createMockUser();
    await createMockEstimate(user.id);
    console.log('Mock data initialized successfully');
  } catch (error) {
    console.error('Error initializing mock data:', error);
  }
};
