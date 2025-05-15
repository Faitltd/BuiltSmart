import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import { fetchEstimate, selectCurrentEstimate } from '../../store/slices/estimateSlice';
import { closeModal, selectModalData } from '../../store/slices/uiSlice';
import Modal from './Modal';
import { gql, useMutation } from '@apollo/client';

const UPDATE_ROOM = gql`
  mutation UpdateRoom($estimateId: ID!, $roomId: ID!, $input: RoomInput!) {
    updateRoom(estimate_id: $estimateId, room_id: $roomId, input: $input) {
      id
      name
      type
      dimensions {
        length
        width
        height
        area
      }
    }
  }
`;

const roomTypes = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'living_room', label: 'Living Room' },
  { value: 'dining_room', label: 'Dining Room' },
  { value: 'office', label: 'Office' },
  { value: 'basement', label: 'Basement' },
  { value: 'garage', label: 'Garage' },
  { value: 'laundry_room', label: 'Laundry Room' },
  { value: 'other', label: 'Other' },
];

const EditRoomModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const estimate = useSelector(selectCurrentEstimate);
  const roomData = useSelector(selectModalData);

  const [name, setName] = useState('');
  const [type, setType] = useState('kitchen');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [updateRoom] = useMutation(UPDATE_ROOM);

  // Initialize form with room data
  useEffect(() => {
    if (roomData && isOpen) {
      setName(roomData.name || '');
      setType(roomData.type || 'kitchen');
      setLength(roomData.dimensions?.length?.toString() || '');
      setWidth(roomData.dimensions?.width?.toString() || '');
      setHeight(roomData.dimensions?.height?.toString() || '');
    }
  }, [roomData, isOpen]);

  const handleClose = () => {
    dispatch(closeModal('editRoom'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    if (!length || !width) {
      setError('Length and width are required');
      return;
    }

    const lengthValue = parseFloat(length);
    const widthValue = parseFloat(width);
    const heightValue = height ? parseFloat(height) : undefined;

    if (isNaN(lengthValue) || isNaN(widthValue) || (height && isNaN(heightValue))) {
      setError('Dimensions must be valid numbers');
      return;
    }

    if (lengthValue <= 0 || widthValue <= 0 || (heightValue && heightValue <= 0)) {
      setError('Dimensions must be positive numbers');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!estimate || !roomData) {
        throw new Error('No active estimate or room');
      }

      await updateRoom({
        variables: {
          estimateId: estimate.id,
          roomId: roomData.id,
          input: {
            name,
            type,
            dimensions: {
              length: lengthValue,
              width: widthValue,
              height: heightValue,
            },
          },
        },
      });

      // Refresh estimate data
      await dispatch(fetchEstimate(estimate.id));

      // Close modal
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update room');
      console.error('Error updating room:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Room">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Master Bathroom"
            className="input-field"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-field"
            disabled={loading}
          >
            {roomTypes.map((roomType) => (
              <option key={roomType.value} value={roomType.value}>
                {roomType.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dimensions (feet)
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Length</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="Length"
                className="input-field"
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Width"
                className="input-field"
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Height (optional)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Height"
                className="input-field"
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>
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
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditRoomModal;
