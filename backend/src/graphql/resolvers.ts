// @ts-nocheck
import { User, Estimate, IUser, IEstimate } from '../database/mongodb/schemas';
import pool from '../database/postgres/connection';
import { PubSub } from 'graphql-subscriptions';
import { calculateLaborCost, calculateRemodelingCostForRoom, calculateHandymanTaskCost } from '../services/estimateService';
import { searchProducts, getProductDetails, getProductByUrl } from '../services/productService';
import { processLLMConversation } from '../services/llmService';
import { uploadFile } from '../services/fileService';
import mongoose from 'mongoose';
import { getAvailableRoomTypes, getAvailableQualityLevels, getAvailableHandymanTasks } from '../services/costCalculationService';

const pubsub = new PubSub();

const resolvers = {
  Query: {
    // User queries
    user: async (_, { id }) => {
      return await User.findById(id);
    },
    users: async () => {
      return await User.find();
    },

    // Estimate queries
    estimate: async (_, { id }) => {
      return await Estimate.findById(id).populate('user_id');
    },
    estimates: async (_, { user_id }) => {
      const query = user_id ? { user_id } : {};
      return await Estimate.find(query).populate('user_id');
    },

    // Product queries
    products: async (_, { query, source, category_id, tier }) => {
      return await searchProducts(query, source, category_id, tier);
    },
    product: async (_, { id }) => {
      return await getProductDetails(id);
    },
    productByUrl: async (_, { url }) => {
      return await getProductByUrl(url);
    },

    // Trade queries
    trades: async () => {
      const result = await pool.query('SELECT * FROM trades');
      return result.rows;
    },

    // Labor rate queries
    laborRates: async (_, { trade_id, region }) => {
      let query = 'SELECT lr.*, t.name as trade_name FROM labor_rates lr JOIN trades t ON lr.trade_id = t.id';
      const params: any[] = [];

      if (trade_id || region) {
        query += ' WHERE';

        if (trade_id) {
          query += ' lr.trade_id = $1';
          params.push(trade_id);
        }

        if (trade_id && region) {
          query += ' AND';
        }

        if (region) {
          query += ` lr.region = $${params.length + 1}`;
          params.push(region);
        }
      }

      const result = await pool.query(query, params);
      return result.rows;
    },

    // Product category queries
    productCategories: async (_, { parent_id }) => {
      let query = 'SELECT c.*, p.name as parent_name FROM product_categories c LEFT JOIN product_categories p ON c.parent_id = p.id';

      if (parent_id !== undefined) {
        query += ' WHERE c.parent_id ' + (parent_id === null ? 'IS NULL' : '= $1');
        const params = parent_id !== null ? [parent_id] : [];
        const result = await pool.query(query, params);
        return result.rows;
      }

      const result = await pool.query(query);
      return result.rows;
    },

    // Cost calculation queries
    calculateRemodelingCost: (_, { roomType, qualityLevel, area }) => {
      return calculateRemodelingCostForRoom(roomType, qualityLevel, { length: 0, width: 0, area });
    },

    calculateHandymanCost: (_, { taskKey, quantity, serviceType = 'handyman' }) => {
      return calculateHandymanTaskCost(taskKey, quantity, serviceType as 'handyman' | 'contractor');
    },

    availableRoomTypes: () => {
      const roomTypes = getAvailableRoomTypes();
      return roomTypes.map(roomType => ({
        name: roomType,
        qualityLevels: getAvailableQualityLevels()
      }));
    },

    availableHandymanTasks: () => {
      return getAvailableHandymanTasks();
    }
  },

  Mutation: {
    // User mutations
    createUser: async (_, { input }) => {
      const user = new User(input);
      await user.save();
      return user;
    },
    updateUser: async (_, { id, input }) => {
      return await User.findByIdAndUpdate(id, input, { new: true });
    },

    // Estimate mutations
    createEstimate: async (_, { user_id }) => {
      const estimate = new Estimate({
        user_id,
        status: 'draft',
        rooms: [],
        conversation_history: [],
        photos: [],
        totals: {
          labor: 0,
          products: 0,
          tax: 0,
          grand_total: 0
        }
      });

      await estimate.save();
      return estimate;
    },
    updateEstimate: async (_, { id, input }) => {
      const estimate = await Estimate.findByIdAndUpdate(id, {
        ...input,
        updated_at: new Date()
      }, { new: true });

      pubsub.publish('ESTIMATE_UPDATED', { estimateUpdated: estimate });
      return estimate;
    },

    // Room mutations
    addRoom: async (_, { estimate_id, input }) => {
      const { name, type, dimensions } = input;
      const area = dimensions.length * dimensions.width;

      const room = {
        _id: new mongoose.Types.ObjectId(),
        name,
        type,
        dimensions: {
          ...dimensions,
          area
        },
        labor_items: [],
        product_items: []
      };

      const estimate = await Estimate.findByIdAndUpdate(
        estimate_id,
        {
          $push: { rooms: room },
          updated_at: new Date()
        },
        { new: true }
      );

      pubsub.publish('ESTIMATE_UPDATED', { estimateUpdated: estimate });

      // Find the newly added room
      // Find the newly added room by name and type
      const addedRoom = estimate?.rooms.find(r => r.name === room.name && r.type === room.type);
      return addedRoom;
    },

    // More mutations will be implemented here...

    // Message mutations
    sendMessage: async (_, { estimate_id, content }) => {
      const message = {
        _id: new mongoose.Types.ObjectId(),
        role: 'user',
        content,
        timestamp: new Date()
      };

      // Add user message to conversation history
      await Estimate.findByIdAndUpdate(
        estimate_id,
        {
          $push: { conversation_history: message },
          updated_at: new Date()
        }
      );

      // Process with LLM and get response
      const estimate = await Estimate.findById(estimate_id);
      if (!estimate) {
        throw new Error('Estimate not found');
      }

      const llmResponse = await processLLMConversation(estimate, content);

      // Check if we need to update the estimate based on LLM actions
      if (llmResponse.updatedEstimate) {
        // In a real implementation, we would update the estimate here
        // based on the structured data and actions
        console.log('Estimate would be updated based on LLM actions');
      }

      // If we have structured data, we can use it to enhance the response
      let enhancedMessage = llmResponse.message;
      if (llmResponse.structuredData && llmResponse.structuredData.products) {
        const products = llmResponse.structuredData.products;
        if (products.length > 0) {
          enhancedMessage += '\n\nI found some products that might work for your project:';
          products.slice(0, 3).forEach((product: any, index: number) => {
            enhancedMessage += `\n\n${index + 1}. ${product.name} - $${product.price}`;
            if (product.description) {
              enhancedMessage += `\n   ${product.description.substring(0, 100)}...`;
            }
          });
        }
      }

      // Add assistant message to conversation history
      const assistantMessage = {
        _id: new mongoose.Types.ObjectId(),
        role: 'assistant',
        content: enhancedMessage,
        timestamp: new Date()
      };

      await Estimate.findByIdAndUpdate(
        estimate_id,
        {
          $push: { conversation_history: assistantMessage },
          updated_at: new Date()
        }
      );

      pubsub.publish('NEW_MESSAGE', {
        newMessage: assistantMessage,
        estimate_id
      });

      return assistantMessage;
    }
  },

  Subscription: {
    estimateUpdated: {
      subscribe: () => pubsub.asyncIterator(['ESTIMATE_UPDATED'])
    },
    newMessage: {
      subscribe: () => pubsub.asyncIterator(['NEW_MESSAGE'])
    }
  },

  Estimate: {
    user: async (parent) => {
      return await User.findById(parent.user_id);
    }
  }
};

export default resolvers;
