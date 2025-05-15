import mongoose, { Schema, Document } from 'mongoose';

// User Interface
export interface IUser extends Document {
  email: string;
  name: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  created_at: Date;
}

// Estimate Interface
export interface IEstimate extends Document {
  user_id: mongoose.Types.ObjectId;
  status: string;
  created_at: Date;
  updated_at: Date;
  rooms: Array<{
    name: string;
    type: string;
    dimensions: {
      length: number;
      width: number;
      height?: number;
      area: number;
    };
    labor_items: Array<{
      trade_id: number;
      description: string;
      quantity: number;
      unit: string;
      rate: number;
      total: number;
    }>;
    product_items: Array<{
      product_id?: string;
      category_id: number;
      name: string;
      description?: string;
      price: number;
      quantity: number;
      total: number;
      source?: string;
      url?: string;
      image_url?: string;
    }>;
  }>;
  conversation_history: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  photos: Array<{
    url: string;
    room: string;
    description?: string;
    uploaded_at: Date;
  }>;
  totals: {
    labor: number;
    products: number;
    tax: number;
    grand_total: number;
  };
}

// User Schema
const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String }
  },
  created_at: { type: Date, default: Date.now }
});

// Estimate Schema
const EstimateSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'completed', 'archived'], default: 'draft' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  rooms: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number },
      area: { type: Number, required: true }
    },
    labor_items: [{
      trade_id: { type: Number, required: true },
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      rate: { type: Number, required: true },
      total: { type: Number, required: true }
    }],
    product_items: [{
      product_id: { type: String },
      category_id: { type: Number, required: true },
      name: { type: String, required: true },
      description: { type: String },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      total: { type: Number, required: true },
      source: { type: String },
      url: { type: String },
      image_url: { type: String }
    }]
  }],
  conversation_history: [{
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  photos: [{
    url: { type: String, required: true },
    room: { type: String, required: true },
    description: { type: String },
    uploaded_at: { type: Date, default: Date.now }
  }],
  totals: {
    labor: { type: Number, default: 0 },
    products: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grand_total: { type: Number, default: 0 }
  }
});

// Create and export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const Estimate = mongoose.model<IEstimate>('Estimate', EstimateSchema);
