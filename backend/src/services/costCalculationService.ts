import { remodelingCosts, roomDescriptors } from '../data/remodelingCosts';
import { handymanCosts } from '../data/handymanCosts';

/**
 * Calculate remodeling costs based on room type, quality level, and area
 * @param roomType The type of room being remodeled
 * @param qualityLevel The quality level of materials and work
 * @param area The area of the room in square feet
 * @returns An object containing the low and high cost estimates
 */
export const calculateRemodelingCost = (
  roomType: string,
  qualityLevel: string,
  area: number
): { lowCost: number; highCost: number; descriptor: string } => {
  // Default values if room type or quality level not found
  let lowRate = 50;
  let highRate = 100;
  let descriptor = '';

  // Get rates from remodeling costs data
  if (remodelingCosts[roomType] && remodelingCosts[roomType][qualityLevel]) {
    lowRate = remodelingCosts[roomType][qualityLevel].low;
    highRate = remodelingCosts[roomType][qualityLevel].high;
  }

  // Get descriptor from room descriptors data
  if (roomDescriptors[roomType] && roomDescriptors[roomType][qualityLevel]) {
    descriptor = roomDescriptors[roomType][qualityLevel];
  }

  // Calculate costs
  const lowCost = lowRate * area;
  const highCost = highRate * area;

  return {
    lowCost,
    highCost,
    descriptor
  };
};

/**
 * Calculate handyman task costs
 * @param taskKey The key of the task in the handymanCosts object
 * @param quantity The quantity of the task
 * @param serviceType Whether the service is provided by a handyman or contractor
 * @returns An object containing the low and high cost estimates
 */
export const calculateHandymanCost = (
  taskKey: string,
  quantity: number,
  serviceType: 'handyman' | 'contractor' = 'handyman'
): { lowCost: number; highCost: number; unit: string; label: string } => {
  // Default values if task not found
  let lowRate = 50;
  let highRate = 100;
  let unit = 'per job';
  let label = 'Unknown task';

  // Get rates from handyman costs data
  if (handymanCosts[taskKey]) {
    const task = handymanCosts[taskKey];
    const rates = serviceType === 'handyman' ? task.handyman : task.contractor;
    
    lowRate = rates[0];
    highRate = rates[1];
    unit = task.unit;
    label = task.label;
  }

  // Calculate costs
  const lowCost = lowRate * quantity;
  const highCost = highRate * quantity;

  return {
    lowCost,
    highCost,
    unit,
    label
  };
};

/**
 * Get all available room types for remodeling
 * @returns An array of room type strings
 */
export const getAvailableRoomTypes = (): string[] => {
  return Object.keys(remodelingCosts);
};

/**
 * Get all available quality levels for remodeling
 * @returns An array of quality level strings
 */
export const getAvailableQualityLevels = (): string[] => {
  // All room types have the same quality levels, so we can use any room type
  const firstRoomType = Object.keys(remodelingCosts)[0];
  return Object.keys(remodelingCosts[firstRoomType]);
};

/**
 * Get all available handyman tasks
 * @returns An array of task objects with key, label, and unit
 */
export const getAvailableHandymanTasks = (): Array<{ key: string; label: string; unit: string }> => {
  return Object.entries(handymanCosts).map(([key, task]) => ({
    key,
    label: task.label,
    unit: task.unit
  }));
};
