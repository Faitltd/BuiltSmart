import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { graphqlClient } from '../../api/graphqlClient';
import { gql } from '@apollo/client';

// Types
interface Room {
  id: string;
  name: string;
  type: string;
  dimensions: {
    length: number;
    width: number;
    height?: number;
    area: number;
  };
  labor_items: LaborItem[];
  product_items: ProductItem[];
  photos: Photo[];
}

interface LaborItem {
  id: string;
  trade_id: number;
  trade_name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

interface ProductItem {
  id: string;
  product_id?: string;
  category_id: number;
  category_name: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  total: number;
  source?: string;
  url?: string;
  image_url?: string;
}

interface Photo {
  id: string;
  url: string;
  room: string;
  description?: string;
  uploaded_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface Estimate {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  rooms: Room[];
  conversation_history: Message[];
  photos: Photo[];
  totals: {
    labor: number;
    products: number;
    tax: number;
    grand_total: number;
  };
}

interface EstimateState {
  currentEstimate: Estimate | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: EstimateState = {
  currentEstimate: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchEstimate = createAsyncThunk(
  'estimate/fetchEstimate',
  async (estimateId: string, { rejectWithValue }) => {
    try {
      const { data } = await graphqlClient.query({
        query: gql`
          query GetEstimate($id: ID!) {
            estimate(id: $id) {
              id
              status
              created_at
              updated_at
              rooms {
                id
                name
                type
                dimensions {
                  length
                  width
                  height
                  area
                }
                labor_items {
                  id
                  trade_id
                  trade_name
                  description
                  quantity
                  unit
                  rate
                  total
                }
                product_items {
                  id
                  product_id
                  category_id
                  category_name
                  name
                  description
                  price
                  quantity
                  total
                  source
                  url
                  image_url
                }
                photos {
                  id
                  url
                  room
                  description
                  uploaded_at
                }
              }
              conversation_history {
                id
                role
                content
                timestamp
              }
              photos {
                id
                url
                room
                description
                uploaded_at
              }
              totals {
                labor
                products
                tax
                grand_total
              }
            }
          }
        `,
        variables: { id: estimateId },
      });

      return data.estimate;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'estimate/sendMessage',
  async ({ estimateId, content }: { estimateId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data } = await graphqlClient.mutate({
        mutation: gql`
          mutation SendMessage($estimateId: ID!, $content: String!) {
            sendMessage(estimate_id: $estimateId, content: $content) {
              id
              role
              content
              timestamp
            }
          }
        `,
        variables: { estimateId, content },
      });

      return data.sendMessage;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const estimateSlice = createSlice({
  name: 'estimate',
  initialState,
  reducers: {
    setCurrentEstimate: (state, action: PayloadAction<Estimate>) => {
      state.currentEstimate = action.payload;
    },
    clearCurrentEstimate: (state) => {
      state.currentEstimate = null;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.currentEstimate) {
        state.currentEstimate.conversation_history.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEstimate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstimate.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEstimate = action.payload;
      })
      .addCase(fetchEstimate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentEstimate) {
          state.currentEstimate.conversation_history.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentEstimate, clearCurrentEstimate, addMessage } = estimateSlice.actions;

export const selectCurrentEstimate = (state: RootState) => state.estimate.currentEstimate;
export const selectConversationHistory = (state: RootState) =>
  state.estimate.currentEstimate?.conversation_history || [];
export const selectRooms = (state: RootState) =>
  state.estimate.currentEstimate?.rooms || [];
export const selectTotals = (state: RootState) =>
  state.estimate.currentEstimate?.totals || { labor: 0, products: 0, tax: 0, grand_total: 0 };
export const selectEstimateLoading = (state: RootState) => state.estimate.loading;
export const selectEstimateError = (state: RootState) => state.estimate.error;

export default estimateSlice.reducer;
