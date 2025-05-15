import { gql } from '@apollo/client';

// Query to get available room types and their quality levels
export const GET_ROOM_TYPES = gql`
  query GetRoomTypes {
    availableRoomTypes {
      name
      qualityLevels
    }
  }
`;

// Query to get available handyman tasks
export const GET_HANDYMAN_TASKS = gql`
  query GetHandymanTasks {
    availableHandymanTasks {
      key
      label
      unit
    }
  }
`;

// Query to calculate remodeling cost
export const CALCULATE_REMODELING_COST = gql`
  query CalculateRemodelingCost($roomType: String!, $qualityLevel: String!, $area: Float!) {
    calculateRemodelingCost(roomType: $roomType, qualityLevel: $qualityLevel, area: $area) {
      lowCost
      highCost
      descriptor
    }
  }
`;

// Query to calculate handyman cost
export const CALCULATE_HANDYMAN_COST = gql`
  query CalculateHandymanCost($taskKey: String!, $quantity: Int!, $serviceType: String) {
    calculateHandymanCost(taskKey: $taskKey, quantity: $quantity, serviceType: $serviceType) {
      lowCost
      highCost
      unit
      label
    }
  }
`;

// Types for cost calculation responses
export interface RemodelingCost {
  lowCost: number;
  highCost: number;
  descriptor: string;
}

export interface HandymanCost {
  lowCost: number;
  highCost: number;
  unit: string;
  label: string;
}

export interface RoomType {
  name: string;
  qualityLevels: string[];
}

export interface HandymanTask {
  key: string;
  label: string;
  unit: string;
}
