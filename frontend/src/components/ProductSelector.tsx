import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchProducts,
  getProductByUrl,
  fetchProductCategories,
  selectSearchResults,
  selectCategories,
  selectProductLoading,
  selectProductError,
} from '../store/slices/productSlice';
import type { AppDispatch } from '../store';

interface ProductSelectorProps {
  category?: string;
  room?: string;
  onSelect: (product: any) => void;
  tierPreference?: 'good' | 'better' | 'best';
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  category,
  room,
  onSelect,
  tierPreference = 'better',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const searchResults = useSelector(selectSearchResults);
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectProductLoading);
  const error = useSelector(selectProductError);

  const [searchQuery, setSearchQuery] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [selectedTier, setSelectedTier] = useState<string>(tierPreference);

  useEffect(() => {
    // Fetch categories when component mounts
    dispatch(fetchProductCategories());
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    dispatch(
      searchProducts({
        query: searchQuery,
        category_id: selectedCategory,
        tier: selectedTier,
      })
    );
  };

  const handleUrlSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productUrl.trim()) return;

    dispatch(getProductByUrl(productUrl)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        onSelect(action.payload);
        setProductUrl('');
      }
    });
  };

  const handleProductSelect = (product: any) => {
    onSelect(product);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Select Products</h2>

      <div className="mb-6">
        <h3 className="font-medium mb-2">Search by URL</h3>
        <form onSubmit={handleUrlSearch} className="flex">
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="Paste product URL from Home Depot, Lowes, etc."
            className="input-field flex-1"
          />
          <button
            type="submit"
            className="btn-primary ml-2"
            disabled={loading || !productUrl.trim()}
          >
            {loading ? 'Loading...' : 'Get Product'}
          </button>
        </form>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-2">Search by Keyword</h3>
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Quality Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="input-field"
              >
                <option value="good">Good (Budget)</option>
                <option value="better">Better (Standard)</option>
                <option value="best">Best (Premium)</option>
              </select>
            </div>
          </div>
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="input-field flex-1"
            />
            <button
              type="submit"
              className="btn-primary ml-2"
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div>
        <h3 className="font-medium mb-2">Search Results</h3>
        {loading ? (
          <div className="text-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No products found</p>
            <p className="mt-2 text-gray-400">Try a different search term or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="border rounded-md p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-md mr-3"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.category_name}</p>
                    <p className="text-sm text-gray-500">
                      Source: {product.source || 'Unknown'}
                    </p>
                    <p className="font-medium mt-1">{formatCurrency(product.price)}</p>
                    {product.tier && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.tier === 'good' ? 'bg-green-100 text-green-800' :
                        product.tier === 'better' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {product.tier.charAt(0).toUpperCase() + product.tier.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSelector;
