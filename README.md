# BuildSmart: Interactive Estimate Builder System

BuildSmart is an interactive estimate builder system for home improvement projects. It allows homeowners to create detailed estimates for their remodeling projects through a conversational interface.

## Features

- Conversational interface for creating estimates with GPT integration
- Room-based estimate organization
- Labor cost calculation based on room dimensions
- Product selection with good/better/best options
- Photo upload for rooms
- Real-time estimate updates

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- Apollo Client for GraphQL
- TailwindCSS for styling
- Socket.io for real-time updates

### Backend
- Node.js with Express
- GraphQL with Apollo Server
- MongoDB for user data and estimates
- PostgreSQL for product/pricing data
- WebSockets for real-time updates
- OpenAI API for GPT-powered chatbot

## Project Structure

```
BuildSmart/
├── backend/             # Node.js backend
│   ├── src/
│   │   ├── database/    # Database connections and schemas
│   │   ├── graphql/     # GraphQL schema and resolvers
│   │   ├── middleware/  # Express middleware
│   │   ├── services/    # Business logic services
│   │   └── index.ts     # Main server file
│   └── package.json
├── frontend/            # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/         # API clients
│   │   ├── components/  # React components
│   │   ├── store/       # Redux store and slices
│   │   ├── App.tsx      # Main App component
│   │   └── main.tsx     # Entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- PostgreSQL

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/BuildSmart.git
   cd BuildSmart
   ```

2. Install all dependencies at once:
   ```
   npm run install:all
   ```

   Or install dependencies separately:
   ```
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory or use the provided `.env` file
   - Update the values as needed
   - **Important**: To use the GPT-powered chatbot, you need to set your OpenAI API key in the `OPENAI_API_KEY` environment variable

4. Set up the databases:
   - Make sure MongoDB is running locally on port 27017
   - Make sure PostgreSQL is running locally on port 5432
   - Create a PostgreSQL database named 'buildsmart'
   - Initialize the PostgreSQL database with sample data:
     ```
     npm run init-db
     ```

### Running the Application

1. Start both the backend and frontend servers with a single command:
   ```
   npm run dev
   ```

   Or start them separately:
   ```
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd ../frontend
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

### Chatbot Modes

The application offers three different chatbot modes that you can switch between:

1. **GPT Chatbot**: Uses OpenAI's GPT model to provide natural, conversational responses. This mode requires an OpenAI API key.
2. **Rule-Based Chatbot**: Uses a structured, rule-based system to guide users through the estimate creation process.
3. **Labor Cost Bot**: Focuses specifically on providing labor cost information based on room dimensions.

You can switch between these modes using the button in the top-right corner of the chat interface.

### Demo Data

The application comes with pre-configured demo data that will be automatically loaded when you start the backend server in development mode. This includes:

- A demo user account
- A sample estimate with two rooms (kitchen and bathroom)
- Sample products and labor items
- Sample conversation history

This allows you to explore the application's features without having to create data from scratch.

## Deployment

### Local Deployment with Docker

You can deploy the application locally using Docker Compose:

```bash
# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### Google Cloud Run Deployment

The application is set up for deployment to Google Cloud Run:

1. **Set up environment variables in Secret Manager**:
   - Create secrets for MongoDB URI, PostgreSQL credentials, JWT secret, and OpenAI API key
   - Update the Cloud Build trigger with the secret references

2. **Run the Cloud Build trigger**:
   - The trigger will build and deploy both the frontend and backend services
   - The frontend will be available at: https://buildsmart-frontend-us-central1-uc.a.run.app
   - The backend will be available at: https://buildsmart-backend-us-central1-uc.a.run.app

3. **Monitoring and logging**:
   - Monitor the application using Cloud Monitoring dashboards
   - View logs in the Cloud Logging console

### Continuous Deployment

The application is set up for continuous deployment:

1. **Push changes to the main branch**:
   - The Cloud Build trigger will automatically build and deploy the changes
   - The deployment will be rolled out with zero downtime

2. **Manual deployment**:
   - You can also manually run the Cloud Build trigger from the Google Cloud Console

## License

This project is licensed under the MIT License - see the LICENSE file for details.
