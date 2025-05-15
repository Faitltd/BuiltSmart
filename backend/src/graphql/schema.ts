import { gql } from 'apollo-server-express';

// Define the Upload scalar type
const scalarTypeDefs = gql`
  scalar Upload
`;

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    address: Address
    created_at: String!
  }

  type Address {
    street: String
    city: String
    state: String
    zip: String
  }

  type Room {
    id: ID!
    name: String!
    type: String!
    dimensions: Dimensions!
    labor_items: [LaborItem!]!
    product_items: [ProductItem!]!
    photos: [Photo!]!
  }

  type Dimensions {
    length: Float!
    width: Float!
    height: Float
    area: Float!
  }

  type LaborItem {
    id: ID!
    trade_id: Int!
    trade_name: String!
    description: String!
    quantity: Float!
    unit: String!
    rate: Float!
    total: Float!
  }

  type ProductItem {
    id: ID!
    product_id: String
    category_id: Int!
    category_name: String!
    name: String!
    description: String
    price: Float!
    quantity: Float!
    total: Float!
    source: String
    url: String
    image_url: String
  }

  type Estimate {
    id: ID!
    user: User!
    status: String!
    created_at: String!
    updated_at: String!
    rooms: [Room!]!
    conversation_history: [Message!]!
    photos: [Photo!]!
    totals: Totals!
  }

  type Totals {
    labor: Float!
    products: Float!
    tax: Float!
    grand_total: Float!
  }

  type Message {
    id: ID!
    role: String!
    content: String!
    timestamp: String!
  }

  type Photo {
    id: ID!
    url: String!
    room: String!
    description: String
    uploaded_at: String!
  }

  type Product {
    id: ID!
    external_id: String
    name: String!
    description: String
    category_id: Int!
    category_name: String!
    price: Float!
    url: String
    image_url: String
    source: String
    tier: String
  }

  type Trade {
    id: ID!
    name: String!
    description: String
  }

  type LaborRate {
    id: ID!
    trade_id: Int!
    trade_name: String!
    unit: String!
    rate: Float!
    region: String
  }

  type ProductCategory {
    id: ID!
    name: String!
    parent_id: Int
    parent_name: String
  }

  type RemodelingCost {
    lowCost: Float!
    highCost: Float!
    descriptor: String!
  }

  type HandymanCost {
    lowCost: Float!
    highCost: Float!
    unit: String!
    label: String!
  }

  type RoomType {
    name: String!
    qualityLevels: [String!]!
  }

  type HandymanTask {
    key: String!
    label: String!
    unit: String!
  }

  input AddressInput {
    street: String
    city: String
    state: String
    zip: String
  }

  input DimensionsInput {
    length: Float!
    width: Float!
    height: Float
  }

  input LaborItemInput {
    trade_id: Int!
    description: String!
    quantity: Float!
    unit: String!
  }

  input ProductItemInput {
    product_id: String
    category_id: Int!
    name: String!
    description: String
    price: Float!
    quantity: Float!
    source: String
    url: String
    image_url: String
  }

  input RoomInput {
    name: String!
    type: String!
    dimensions: DimensionsInput!
  }

  input EstimateInput {
    status: String
  }

  input UserInput {
    name: String!
    email: String!
    phone: String
    address: AddressInput
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
    estimate(id: ID!): Estimate
    estimates(user_id: ID): [Estimate!]!
    products(query: String!, source: String, category_id: Int, tier: String): [Product!]!
    product(id: ID!): Product
    productByUrl(url: String!): Product
    trades: [Trade!]!
    laborRates(trade_id: Int, region: String): [LaborRate!]!
    productCategories(parent_id: Int): [ProductCategory!]!

    # Cost calculation queries
    calculateRemodelingCost(roomType: String!, qualityLevel: String!, area: Float!): RemodelingCost!
    calculateHandymanCost(taskKey: String!, quantity: Int!, serviceType: String): HandymanCost!
    availableRoomTypes: [RoomType!]!
    availableHandymanTasks: [HandymanTask!]!
  }

  type Mutation {
    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserInput!): User!
    createEstimate(user_id: ID!): Estimate!
    updateEstimate(id: ID!, input: EstimateInput!): Estimate!
    addRoom(estimate_id: ID!, input: RoomInput!): Room!
    updateRoom(estimate_id: ID!, room_id: ID!, input: RoomInput!): Room!
    removeRoom(estimate_id: ID!, room_id: ID!): Boolean!
    addLaborItem(estimate_id: ID!, room_id: ID!, input: LaborItemInput!): LaborItem!
    updateLaborItem(estimate_id: ID!, room_id: ID!, item_id: ID!, input: LaborItemInput!): LaborItem!
    removeLaborItem(estimate_id: ID!, room_id: ID!, item_id: ID!): Boolean!
    addProductItem(estimate_id: ID!, room_id: ID!, input: ProductItemInput!): ProductItem!
    updateProductItem(estimate_id: ID!, room_id: ID!, item_id: ID!, input: ProductItemInput!): ProductItem!
    removeProductItem(estimate_id: ID!, room_id: ID!, item_id: ID!): Boolean!
    sendMessage(estimate_id: ID!, content: String!): Message!
    uploadPhoto(estimate_id: ID!, room_id: ID!, file: Upload!): Photo!
    removePhoto(estimate_id: ID!, photo_id: ID!): Boolean!
  }

  type Subscription {
    estimateUpdated(id: ID!): Estimate!
    newMessage(estimate_id: ID!): Message!
  }
`;

// Merge the scalar type definitions with the main type definitions
const mergedTypeDefs = [scalarTypeDefs, typeDefs];

export default mergedTypeDefs;
