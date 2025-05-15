import { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import * as costQueries from '../api/costQueries';
import { remodelingCosts, roomDescriptors, handymanCosts } from '../mocks/costData';

// Import the GraphQL queries
const {
  GET_ROOM_TYPES,
  GET_HANDYMAN_TASKS,
  CALCULATE_REMODELING_COST,
  CALCULATE_HANDYMAN_COST
} = costQueries;

// Import the types
type RoomType = costQueries.RoomType;
type HandymanTask = costQueries.HandymanTask;
type RemodelingCost = costQueries.RemodelingCost;
type HandymanCost = costQueries.HandymanCost;

export const useCostCalculation = () => {
  const [remodelingCost, setRemodelingCost] = useState<RemodelingCost | null>(null);
  const [handymanCost, setHandymanCost] = useState<HandymanCost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock room types data
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Mock handyman tasks data
  const [handymanTasks, setHandymanTasks] = useState<HandymanTask[]>([]);

  // Initialize mock data
  useEffect(() => {
    try {
      // Create room types from the mock data
      const mockRoomTypes = Object.keys(remodelingCosts).map(roomType => ({
        name: roomType,
        qualityLevels: Object.keys(remodelingCosts[roomType])
      }));

      setRoomTypes(mockRoomTypes);

      // Create handyman tasks from the mock data
      const mockHandymanTasks = Object.entries(handymanCosts).map(([key, task]) => ({
        key,
        label: task.label,
        unit: task.unit
      }));

      setHandymanTasks(mockHandymanTasks);
    } catch (err) {
      console.error('Error initializing mock data:', err);
      setError(err as Error);
    }
  }, []);

  // Function to calculate remodeling cost
  const calculateRoomCost = (roomType: string, qualityLevel: string, area: number) => {
    setIsLoading(true);

    try {
      // Get the cost rates from the mock data
      const costRates = remodelingCosts[roomType]?.[qualityLevel];

      if (!costRates) {
        throw new Error(`No cost rates found for ${roomType} at ${qualityLevel} quality level`);
      }

      // Calculate the cost
      const lowCost = costRates.low * area;
      const highCost = costRates.high * area;

      // Get the descriptor
      const descriptor = roomDescriptors[roomType]?.[qualityLevel] || '';

      // Set the remodeling cost
      setRemodelingCost({
        lowCost,
        highCost,
        descriptor
      });
    } catch (err) {
      console.error('Error calculating remodeling cost:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate handyman task cost
  const calculateTaskCost = (taskKey: string, quantity: number, serviceType: 'handyman' | 'contractor' = 'handyman') => {
    setIsLoading(true);

    try {
      // Get the task from the mock data
      const task = handymanCosts[taskKey];

      if (!task) {
        throw new Error(`No task found for ${taskKey}`);
      }

      // Get the cost rates based on service type
      const [lowRate, highRate] = serviceType === 'handyman' ? task.handyman : task.contractor;

      // Calculate the cost
      const lowCost = lowRate * quantity;
      const highCost = highRate * quantity;

      // Set the handyman cost
      setHandymanCost({
        lowCost,
        highCost,
        unit: task.unit,
        label: task.label
      });
    } catch (err) {
      console.error('Error calculating handyman cost:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    roomTypes,
    handymanTasks,
    remodelingCost,
    handymanCost,
    calculateRoomCost,
    calculateTaskCost,
    isLoading,
    error
  };
};

export default useCostCalculation;
