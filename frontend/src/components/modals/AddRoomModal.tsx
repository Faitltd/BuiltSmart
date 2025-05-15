import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import { fetchEstimate, selectCurrentEstimate } from '../../store/slices/estimateSlice';
import { closeModal } from '../../store/slices/uiSlice';
import Modal from './Modal';
import { gql, useMutation } from '@apollo/client';
import useCostCalculation from '../../hooks/useCostCalculation';
import CostPreview from '../CostPreview';

const ADD_ROOM = gql`
  mutation AddRoom($estimateId: ID!, $input: RoomInput!) {
    addRoom(estimate_id: $estimateId, input: $input) {
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



const AddRoomModal: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const estimate = useSelector(selectCurrentEstimate);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [qualityLevel, setQualityLevel] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    roomTypes,
    remodelingCost,
    calculateRoomCost,
    isLoading: costLoading
  } = useCostCalculation();

  const [addRoom] = useMutation(ADD_ROOM);

  // Set default room type and quality level when data is loaded
  useEffect(() => {
    if (roomTypes.length > 0 && !type) {
      setType(roomTypes[0].name);

      if (roomTypes[0].qualityLevels.length > 0) {
        setQualityLevel(roomTypes[0].qualityLevels[0]);
      }
    }
  }, [roomTypes, type]);

  // Calculate cost when inputs change
  useEffect(() => {
    if (type && qualityLevel && length && width) {
      const lengthValue = parseFloat(length);
      const widthValue = parseFloat(width);

      if (!isNaN(lengthValue) && !isNaN(widthValue) && lengthValue > 0 && widthValue > 0) {
        const area = lengthValue * widthValue;
        calculateRoomCost(type, qualityLevel, area);
      }
    }
  }, [type, qualityLevel, length, width, calculateRoomCost]);

  const handleClose = () => {
    dispatch(closeModal('addRoom'));
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setType(roomTypes.length > 0 ? roomTypes[0].name : '');
    setQualityLevel(roomTypes.length > 0 && roomTypes[0].qualityLevels.length > 0 ? roomTypes[0].qualityLevels[0] : '');
    setLength('');
    setWidth('');
    setHeight('');
    setError(null);
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
      if (!estimate) {
        throw new Error('No active estimate');
      }

      // Map room type to the expected format
      const roomTypeValue = type.toLowerCase().replace(/\s+/g, '_');

      await addRoom({
        variables: {
          estimateId: estimate.id,
          input: {
            name,
            type: roomTypeValue,
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

      // Close modal and reset form
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add room');
      console.error('Error adding room:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get quality levels for selected room type
  const qualityLevels = roomTypes.find(room => room.name === type)?.qualityLevels || [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Room" size="lg">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
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
                disabled={loading || roomTypes.length === 0}
              >
                {roomTypes.map((roomType) => (
                  <option key={roomType.name} value={roomType.name}>
                    {roomType.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality Level
              </label>
              <select
                value={qualityLevel}
                onChange={(e) => setQualityLevel(e.target.value)}
                className="input-field"
                disabled={loading || qualityLevels.length === 0}
              >
                {qualityLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
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
                {loading ? 'Adding...' : 'Add Room'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Cost Estimate</h3>
          <CostPreview
            cost={remodelingCost}
            loading={costLoading}
            type="remodeling"
          />

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">About Quality Levels</h4>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Good</dt>
                <dd className="text-gray-600">Standard quality materials and practical design elements</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Better</dt>
                <dd className="text-gray-600">Premium quality materials with enhanced design elements</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Best</dt>
                <dd className="text-gray-600">High-end materials with custom design elements</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Fully Custom</dt>
                <dd className="text-gray-600">Completely bespoke design with rare and exclusive materials</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddRoomModal;
