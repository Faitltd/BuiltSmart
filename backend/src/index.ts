import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { connectMongoDB } from './database/mongodb/connection';
import typeDefs from './graphql/schema';
import resolvers from './graphql/resolvers';
import { verifyToken } from './middleware/auth';
import path from 'path';
// Import chatbot routes using require for JS file
const chatbotRoutes = require('./routes/chatbotRoutes');

// Load environment variables
dotenv.config();

// Set up Express app
const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4001'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/chatbot', chatbotRoutes);

// Connect to MongoDB
connectMongoDB();

// Initialize mock data for development
if (process.env.NODE_ENV === 'development') {
  const { initMockData } = require('./mockData');
  initMockData().catch((error: Error) => {
    console.error('Error initializing mock data:', error);
  });
}

// Set up GraphQL schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Set up Apollo Server
const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => {
    // Get user from token
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        // In a real implementation, we would verify the token here
        // For now, just return a placeholder user context
        return { user: { id: '1', role: 'user' } };
      } catch (error) {
        console.error('Error verifying token:', error);
      }
    }
    return { user: null };
  },
});

// REST API routes
app.post('/api/v1/search/products', verifyToken, async (req, res) => {
  try {
    const { query, source, category_id, tier } = req.body;

    // Import here to avoid circular dependencies
    const { searchProducts } = require('./services/productService');

    const products = await searchProducts(query, source, category_id, tier);
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
});

app.post('/api/v1/llm/conversation', verifyToken, async (req, res) => {
  try {
    const { estimate_id, message } = req.body;

    // Import here to avoid circular dependencies
    const { Estimate } = require('./database/mongodb/schemas');
    const { processLLMConversation } = require('./services/llmService');

    const estimate = await Estimate.findById(estimate_id);

    if (!estimate) {
      res.status(404).json({ message: 'Estimate not found' });
      return;
    }

    const response = await processLLMConversation(estimate, message);
    res.json(response);
  } catch (error) {
    console.error('Error processing LLM conversation:', error);
    res.status(500).json({ message: 'Error processing conversation' });
  }
});

// Start server
async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app: app as any });

  const httpServer = createServer(app);

  // Set up subscription server
  SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: (connectionParams: any) => {
        // In a real implementation, we would verify the token here
        return { user: { id: '1', role: 'user' } };
      },
    },
    { server: httpServer, path: apolloServer.graphqlPath }
  );

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`Subscriptions endpoint: ws://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
}

startServer().catch(error => {
  console.error('Error starting server:', error);
});
