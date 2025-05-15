import { configureStore } from '@reduxjs/toolkit';
import estimateReducer from './slices/estimateSlice';
import userReducer from './slices/userSlice';
import productReducer from './slices/productSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    estimate: estimateReducer,
    user: userReducer,
    product: productReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
