import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { graphqlClient } from '../../api/graphqlClient';
import { gql } from '@apollo/client';

// Types
interface Product {
  id: string;
  external_id?: string;
  name: string;
  description?: string;
  category_id: number;
  category_name: string;
  price: number;
  url?: string;
  image_url?: string;
  source?: string;
  tier?: string;
}

interface ProductCategory {
  id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
}

interface ProductState {
  searchResults: Product[];
  recommendedProducts: Product[];
  selectedProduct: Product | null;
  categories: ProductCategory[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ProductState = {
  searchResults: [],
  recommendedProducts: [],
  selectedProduct: null,
  categories: [],
  loading: false,
  error: null,
};

// Async thunks
export const searchProducts = createAsyncThunk(
  'product/searchProducts',
  async ({
    query,
    source,
    category_id,
    tier
  }: {
    query: string;
    source?: string;
    category_id?: number;
    tier?: string;
  }, { rejectWithValue }) => {
    try {
      const { data } = await graphqlClient.query({
        query: gql`
          query SearchProducts($query: String!, $source: String, $category_id: Int, $tier: String) {
            products(query: $query, source: $source, category_id: $category_id, tier: $tier) {
              id
              external_id
              name
              description
              category_id
              category_name
              price
              url
              image_url
              source
              tier
            }
          }
        `,
        variables: { query, source, category_id, tier },
      });

      return data.products;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductCategories = createAsyncThunk(
  'product/fetchProductCategories',
  async (parent_id?: number, { rejectWithValue }) => {
    try {
      const { data } = await graphqlClient.query({
        query: gql`
          query GetProductCategories($parent_id: Int) {
            productCategories(parent_id: $parent_id) {
              id
              name
              parent_id
              parent_name
            }
          }
        `,
        variables: { parent_id },
      });

      return data.productCategories;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getProductByUrl = createAsyncThunk(
  'product/getProductByUrl',
  async (url: string, { rejectWithValue }) => {
    try {
      const { data } = await graphqlClient.query({
        query: gql`
          query GetProductByUrl($url: String!) {
            productByUrl(url: $url) {
              id
              external_id
              name
              description
              category_id
              category_name
              price
              url
              image_url
              source
              tier
            }
          }
        `,
        variables: { url },
      });

      return data.productByUrl;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setSelectedProduct: (state, action: PayloadAction<Product>) => {
      state.selectedProduct = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchProductCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getProductByUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductByUrl.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(getProductByUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedProduct, clearSelectedProduct, clearSearchResults } = productSlice.actions;

export const selectSearchResults = (state: RootState) => state.product.searchResults;
export const selectRecommendedProducts = (state: RootState) => state.product.recommendedProducts;
export const selectSelectedProduct = (state: RootState) => state.product.selectedProduct;
export const selectCategories = (state: RootState) => state.product.categories;
export const selectProductLoading = (state: RootState) => state.product.loading;
export const selectProductError = (state: RootState) => state.product.error;

export default productSlice.reducer;
