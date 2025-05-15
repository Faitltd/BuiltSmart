import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import { fetchEstimate, selectCurrentEstimate } from '../../store/slices/estimateSlice';
import { closeModal, selectModalData } from '../../store/slices/uiSlice';
import Modal from './Modal';
import { gql, useMutation } from '@apollo/client';

const UPDATE_PRODUCT_ITEM = gql`
  mutation UpdateProductItem($estimateId: ID!, $roomId: ID!, $itemId: ID!, $input: ProductItemInput!) {
    updateProductItem(estimate_id: $estimateId, room_id: $roomId, item_id: $itemId, input: $input) {
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

const REMOVE_PRODUCT_ITEM = gql`
  mutation RemoveProductItem($estimateId: ID!, $roomId: ID!, $itemId: ID!) {
    removeProductItem(estimate_id: $estimateId, room_id: $roomId, item_id: $itemId)
  }
`;

const ViewProductModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const estimate = useSelector(selectCurrentEstimate);
  const productData = useSelector(selectModalData);

  const [quantity, setQuantity] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [updateProductItem] = useMutation(UPDATE_PRODUCT_ITEM);
  const [removeProductItem] = useMutation(REMOVE_PRODUCT_ITEM);

  // Initialize quantity when product data changes
  React.useEffect(() => {
    if (productData && productData.quantity) {
      setQuantity(productData.quantity.toString());
    }
  }, [productData]);

  const handleClose = () => {
    dispatch(closeModal('viewProduct'));
    setIsEditing(false);
    setError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (productData && productData.quantity) {
      setQuantity(productData.quantity.toString());
    }
    setError(null);
  };

  const handleUpdate = async () => {
    if (!productData) return;

    const quantityValue = parseFloat(quantity);

    if (isNaN(quantityValue) || quantityValue <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!estimate) {
        throw new Error('No active estimate');
      }

      // Find the room that contains this product
      const room = estimate.rooms.find((r) =>
        r.product_items.some((p) => p.id === productData.id)
      );

      if (!room) {
        throw new Error('Room not found for this product');
      }

      await updateProductItem({
        variables: {
          estimateId: estimate.id,
          roomId: room.id,
          itemId: productData.id,
          input: {
            product_id: productData.product_id,
            category_id: productData.category_id,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            quantity: quantityValue,
            source: productData.source,
            url: productData.url,
            image_url: productData.image_url,
          },
        },
      });

      // Refresh estimate data
      await dispatch(fetchEstimate(estimate.id));

      // Exit edit mode
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      console.error('Error updating product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!productData) return;

    if (!confirm('Are you sure you want to remove this product?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!estimate) {
        throw new Error('No active estimate');
      }

      // Find the room that contains this product
      const room = estimate.rooms.find((r) =>
        r.product_items.some((p) => p.id === productData.id)
      );

      if (!room) {
        throw new Error('Room not found for this product');
      }

      await removeProductItem({
        variables: {
          estimateId: estimate.id,
          roomId: room.id,
          itemId: productData.id,
        },
      });

      // Refresh estimate data
      await dispatch(fetchEstimate(estimate.id));

      // Close modal
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove product');
      console.error('Error removing product:', err);
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

  if (!productData) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Product Details">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center mb-4">
          {productData.image_url && (
            <img
              src={productData.image_url}
              alt={productData.name}
              className="w-32 h-32 object-cover rounded-md mr-4"
            />
          )}
          <div>
            <h3 className="text-xl font-medium">{productData.name}</h3>
            <p className="text-sm text-gray-500 mb-1">
              {productData.category_name}
            </p>
            <p className="font-medium text-lg">
              {formatCurrency(productData.price)}
            </p>
            {productData.source && (
              <p className="text-xs text-gray-500 mt-1">
                Source: {productData.source}
              </p>
            )}
          </div>
        </div>

        {productData.description && (
          <div className="mb-4">
            <h4 className="font-medium mb-1">Description</h4>
            <p className="text-gray-600">{productData.description}</p>
          </div>
        )}

        {productData.url && (
          <div className="mb-4">
            <h4 className="font-medium mb-1">Product URL</h4>
            <a
              href={productData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark break-all"
            >
              {productData.url}
            </a>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          {isEditing ? (
            <div>
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
                    productData.price * parseFloat(quantity || '0')
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{productData.quantity}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">
                  {formatCurrency(productData.total)}
                </span>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 border border-red-300 rounded-md text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="btn-primary"
                  disabled={loading}
                >
                  Edit Quantity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewProductModal;
