import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { graphqlClient } from '../../api/graphqlClient';
import { gql } from '@apollo/client';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

interface UserState {
  currentUser: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  currentUser: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

// Async thunks
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data } = await graphqlClient.query({
        query: gql`
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
              email
              phone
              address {
                street
                city
                state
                zip
              }
            }
          }
        `,
        variables: { id: userId },
      });

      return data.user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// For a real implementation, this would be a REST API call to get a JWT token
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // This is a placeholder for a real login API call
      // In a real implementation, this would call your authentication endpoint

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate successful login
      if (email === 'demo@example.com' && password === 'password') {
        const token = 'fake-jwt-token';
        const user = {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
        };

        localStorage.setItem('token', token);

        return { user, token };
      }

      return rejectWithValue('Invalid email or password');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentUser, setToken, logout } = userSlice.actions;

export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectToken = (state: RootState) => state.user.token;
export const selectIsAuthenticated = (state: RootState) => !!state.user.token;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

export default userSlice.reducer;
