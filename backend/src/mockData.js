const { db } = require('./config/firebase');

// Mock user data
const mockUsers = [
  {
    id: 'user1',
    email: 'demo@buildsmart.com',
    name: 'Demo User',
    role: 'user',
    created_at: new Date().toISOString()
  }
];

// Mock estimate data
const mockEstimates = [
  {
    id: 'estimate1',
    user_id: 'user1',
    title: 'Kitchen and Bathroom Remodel',
    description: 'Complete remodel of kitchen and master bathroom',
    status: 'in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rooms: [
      {
        id: 'room1',
        name: 'Kitchen',
        dimensions: {
          length: 12,
          width: 10,
          height: 9
        },
        area: 120,
        items: [
          {
            id: 'item1',
            name: 'Cabinets',
            description: 'Custom kitchen cabinets',
            quantity: 1,
            unit_price: 5000,
            total_price: 5000,
            category: 'cabinets',
            tier: 'better'
          },
          {
            id: 'item2',
            name: 'Countertops',
            description: 'Granite countertops',
            quantity: 30,
            unit_price: 75,
            total_price: 2250,
            category: 'countertops',
            tier: 'better'
          }
        ],
        labor: [
          {
            id: 'labor1',
            name: 'Demolition',
            description: 'Remove existing cabinets and countertops',
            hours: 8,
            rate: 65,
            total: 520
          },
          {
            id: 'labor2',
            name: 'Installation',
            description: 'Install new cabinets and countertops',
            hours: 16,
            rate: 85,
            total: 1360
          }
        ]
      },
      {
        id: 'room2',
        name: 'Bathroom',
        dimensions: {
          length: 8,
          width: 6,
          height: 8
        },
        area: 48,
        items: [
          {
            id: 'item3',
            name: 'Vanity',
            description: 'Modern bathroom vanity with sink',
            quantity: 1,
            unit_price: 1200,
            total_price: 1200,
            category: 'vanities',
            tier: 'better'
          },
          {
            id: 'item4',
            name: 'Shower System',
            description: 'Complete shower system with glass door',
            quantity: 1,
            unit_price: 2500,
            total_price: 2500,
            category: 'plumbing',
            tier: 'best'
          }
        ],
        labor: [
          {
            id: 'labor3',
            name: 'Demolition',
            description: 'Remove existing bathroom fixtures',
            hours: 6,
            rate: 65,
            total: 390
          },
          {
            id: 'labor4',
            name: 'Installation',
            description: 'Install new bathroom fixtures',
            hours: 12,
            rate: 85,
            total: 1020
          }
        ]
      }
    ],
    conversation_history: [
      {
        id: 'msg1',
        role: 'system',
        content: 'I am BuildSmart, your remodeling assistant.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg2',
        role: 'user',
        content: 'I want to remodel my kitchen and bathroom.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg3',
        role: 'assistant',
        content: 'Great! I can help you with that. Let\'s start by getting some information about your kitchen. What are the dimensions?',
        timestamp: new Date().toISOString()
      }
    ]
  }
];

// Initialize Firebase with mock data
async function initFirebaseMockData() {
  try {
    // Check if mock data already exists
    const userSnapshot = await db.collection('users').doc('user1').get();
    
    if (userSnapshot.exists) {
      console.log('Mock data already exists in Firebase');
      return;
    }
    
    console.log('Initializing Firebase with mock data...');
    
    // Add users
    for (const user of mockUsers) {
      await db.collection('users').doc(user.id).set(user);
    }
    
    // Add estimates
    for (const estimate of mockEstimates) {
      await db.collection('estimates').doc(estimate.id).set(estimate);
    }
    
    console.log('Mock data initialized successfully');
  } catch (error) {
    console.error('Error initializing mock data:', error);
    throw error;
  }
}

module.exports = {
  initFirebaseMockData
};
