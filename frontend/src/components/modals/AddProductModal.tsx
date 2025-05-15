import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import { fetchEstimate, selectCurrentEstimate } from '../../store/slices/estimateSlice';
import { closeModal, selectActiveRoomId } from '../../store/slices/uiSlice';
import Modal from './Modal';
import ProductSelector from '../ProductSelector';
import { gql, useMutation } from '@apollo/client';

const ADD_PRODUCT_ITEM = gql`
  mutation AddProductItem($estimateId: ID!, $roomId: ID!, $input: ProductItemInput!) {
    addProductItem(estimate_id: $estimateId, room_id: $roomId, input: $input) {
      id
      product_id
      category_id
      name
      description
      price
      quantity
      total
      source
      url
      image_url
    }
  }
`;

const AddProductModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const estimate = useSelector(selectCurrentEstimate);
  const activeRoomId = useSelector(selectActiveRoomId);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [addProductItem] = useMutation(ADD_PRODUCT_ITEM);

  const handleClose = () => {
    dispatch(closeModal('addProduct'));
    setSelectedProduct(null);
    setQuantity('1');
    setError(null);
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    const quantityValue = parseFloat(quantity);

    if (isNaN(quantityValue) || quantityValue <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!estimate || !activeRoomId) {
        throw new Error('No active estimate or room');
      }

      await addProductItem({
        variables: {
          estimateId: estimate.id,
          roomId: activeRoomId,
          input: {
            product_id: selectedProduct.id,
            category_id: selectedProduct.category_id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            price: selectedProduct.price,
            quantity: quantityValue,
            source: selectedProduct.source,
            url: selectedProduct.url,
            image_url: selectedProduct.image_url,
          },
        },
      });

      // Refresh estimate data
      await dispatch(fetchEstimate(estimate.id));

      // Close modal
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
      console.error('Error adding product:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Product" size="lg">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-r pr-4">
          <ProductSelector onSelect={handleProductSelect} />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Selected Product</h3>

          {selectedProduct ? (
            <div className="mb-6">
              <div className="border rounded-md p-4 mb-4">
                <div className="flex items-center mb-4">
                  {selectedProduct.image_url && (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-20 h-20 object-cover rounded-md mr-3"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <p className="text-sm text-gray-500">
                      {selectedProduct.category_name}
                    </p>
                    <p className="font-medium mt-1">
                      {formatCurrency(selectedProduct.price)}
                    </p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedProduct.description}
                  </p>
                )}

                {selectedProduct.source && (
                  <p className="text-xs text-gray-500">
                    Source: {selectedProduct.source}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field"
                    min="1"
                    step="1"
                    disabled={loading}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <div className="input-field bg-gray-50">
                    {formatCurrency(
                      selectedProduct.price * parseFloat(quantity || '0')
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !selectedProduct}
                  >
                    {loading ? 'Adding...' : 'Add to Estimate'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No product selected</p>
              <p className="mt-2 text-gray-400">
                Select a product from the list or search for one
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddProductModal;
