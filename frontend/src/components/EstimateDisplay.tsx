import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentEstimate, selectRooms, selectTotals } from '../store/slices/estimateSlice';
import { openModal, setActiveRoomId } from '../store/slices/uiSlice';
import type { AppDispatch } from '../store';

const EstimateDisplay: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const estimate = useSelector(selectCurrentEstimate);
  const rooms = useSelector(selectRooms);
  const totals = useSelector(selectTotals);

  if (!estimate) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No estimate selected</p>
      </div>
    );
  }

  const handleAddRoom = () => {
    dispatch(openModal({ type: 'addRoom' }));
  };

  const handleEditRoom = (roomId: string) => {
    dispatch(setActiveRoomId(roomId));
    dispatch(openModal({ type: 'editRoom', data: rooms.find(r => r.id === roomId) }));
  };

  const handleAddProduct = (roomId: string) => {
    dispatch(setActiveRoomId(roomId));
    dispatch(openModal({ type: 'addProduct' }));
  };

  const handleViewProduct = (product: any) => {
    dispatch(openModal({ type: 'viewProduct', data: product }));
  };

  const handleUploadPhoto = (roomId: string) => {
    dispatch(setActiveRoomId(roomId));
    dispatch(openModal({ type: 'uploadPhoto' }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estimate Summary</h2>
        <button
          className="btn-primary"
          onClick={handleAddRoom}
        >
          Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No rooms added yet</p>
          <p className="mt-2 text-gray-400">Start by adding a room to your estimate</p>
        </div>
      ) : (
        <div className="space-y-6">
          {rooms.map((room) => (
            <div key={room.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{room.name} ({room.type})</h3>
                <button
                  className="text-primary hover:text-primary-dark"
                  onClick={() => handleEditRoom(room.id)}
                >
                  Edit
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Dimensions</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Length:</span> {room.dimensions.length} ft
                  </div>
                  <div>
                    <span className="text-gray-500">Width:</span> {room.dimensions.width} ft
                  </div>
                  <div>
                    <span className="text-gray-500">Area:</span> {room.dimensions.area} sq ft
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Labor</h4>
                </div>
                {room.labor_items.length === 0 ? (
                  <p className="text-sm text-gray-500">No labor items added</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Trade</th>
                          <th className="text-left py-2">Description</th>
                          <th className="text-right py-2">Quantity</th>
                          <th className="text-right py-2">Rate</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.labor_items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">{item.trade_name}</td>
                            <td className="py-2">{item.description}</td>
                            <td className="text-right py-2">{item.quantity} {item.unit}</td>
                            <td className="text-right py-2">{formatCurrency(item.rate)}</td>
                            <td className="text-right py-2">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Products</h4>
                  <button
                    className="text-sm text-primary hover:text-primary-dark"
                    onClick={() => handleAddProduct(room.id)}
                  >
                    Add Product
                  </button>
                </div>
                {room.product_items.length === 0 ? (
                  <p className="text-sm text-gray-500">No products added</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {room.product_items.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-md p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewProduct(product)}
                      >
                        <div className="flex items-center">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-md mr-3"
                            />
                          )}
                          <div>
                            <h5 className="font-medium">{product.name}</h5>
                            <p className="text-sm text-gray-500">{product.category_name}</p>
                            <div className="flex justify-between mt-1">
                              <span>{formatCurrency(product.price)} × {product.quantity}</span>
                              <span className="font-medium">{formatCurrency(product.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Photos</h4>
                  <button
                    className="text-sm text-primary hover:text-primary-dark"
                    onClick={() => handleUploadPhoto(room.id)}
                  >
                    Upload Photo
                  </button>
                </div>
                {room.photos && room.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {room.photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.url}
                          alt={photo.description || room.name}
                          className="w-full h-24 object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No photos uploaded</p>
                )}
              </div>
            </div>
          ))}

          <div className="card bg-gray-50">
            <h3 className="text-xl font-semibold mb-4">Estimate Totals</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Labor:</span>
                <span>{formatCurrency(totals.labor)}</span>
              </div>
              <div className="flex justify-between">
                <span>Products:</span>
                <span>{formatCurrency(totals.products)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Grand Total:</span>
                <span>{formatCurrency(totals.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimateDisplay;
