/**
 * Rentcast API Service
 * 
 * This service handles all interactions with the Rentcast API.
 * API Key: 38c2c0725b7a4e31b3421673efb8fa2a
 */

const RENTCAST_API_KEY = '38c2c0725b7a4e31b3421673efb8fa2a';
const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

/**
 * Get rental estimate for a property
 * 
 * @param {Object} propertyData - Property data for rental estimate
 * @param {string} propertyData.address - Full property address
 * @param {number} propertyData.bedrooms - Number of bedrooms
 * @param {number} propertyData.bathrooms - Number of bathrooms
 * @param {string} propertyData.propertyType - Type of property (single-family, apartment, etc.)
 * @param {number} propertyData.squareFeet - Square footage of the property
 * @param {number} propertyData.yearBuilt - Year the property was built
 * @returns {Promise} - Promise resolving to rental estimate data
 */
export const getRentalEstimate = async (propertyData) => {
  try {
    // For development/demo purposes, use the mock API
    if (process.env.REACT_APP_USE_MOCK_API === 'true') {
      return getMockRentalEstimate(propertyData);
    }
    
    // For production, use the real Rentcast API
    const response = await fetch(`${RENTCAST_BASE_URL}/rental-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY
      },
      body: JSON.stringify({
        address: propertyData.address,
        bedrooms: Number(propertyData.bedrooms),
        bathrooms: Number(propertyData.bathrooms),
        propertyType: mapPropertyType(propertyData.propertyType),
        squareFootage: Number(propertyData.squareFeet),
        yearBuilt: propertyData.yearBuilt ? Number(propertyData.yearBuilt) : undefined
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch rental estimate');
    }
    
    const data = await response.json();
    return formatRentcastResponse(data);
  } catch (error) {
    console.error('Error fetching rental estimate:', error);
    throw error;
  }
};

/**
 * Get comparable rental properties
 * 
 * @param {string} address - Property address
 * @param {number} radius - Search radius in miles
 * @returns {Promise} - Promise resolving to comparable properties data
 */
export const getComparableRentals = async (address, radius = 1) => {
  try {
    // For development/demo purposes, use the mock API
    if (process.env.REACT_APP_USE_MOCK_API === 'true') {
      return getMockComparableRentals(address, radius);
    }
    
    // For production, use the real Rentcast API
    const response = await fetch(`${RENTCAST_BASE_URL}/properties/rental-comps?address=${encodeURIComponent(address)}&radius=${radius}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch comparable rentals');
    }
    
    const data = await response.json();
    return formatComparableRentalsResponse(data);
  } catch (error) {
    console.error('Error fetching comparable rentals:', error);
    throw error;
  }
};

/**
 * Map property types to Rentcast API format
 * 
 * @param {string} propertyType - Property type from form
 * @returns {string} - Property type for Rentcast API
 */
const mapPropertyType = (propertyType) => {
  const typeMap = {
    'single-family': 'SFH',
    'apartment': 'APT',
    'condo': 'CONDO',
    'townhouse': 'TOWNHOUSE',
    'luxury': 'SFH' // Map luxury to SFH for API purposes
  };
  
  return typeMap[propertyType] || 'SFH';
};

/**
 * Format Rentcast API response
 * 
 * @param {Object} response - Raw API response
 * @returns {Object} - Formatted response for UI
 */
const formatRentcastResponse = (response) => {
  // Transform the Rentcast API response to match our application's data structure
  return {
    address: response.address,
    estimatedRent: response.rent,
    rentRangeLow: response.rentRangeLow,
    rentRangeHigh: response.rentRangeHigh,
    confidence: response.confidence || 'medium',
    comparableProperties: response.comparableProperties || [],
    financials: calculateFinancials(response.rent)
  };
};

/**
 * Format comparable rentals response
 * 
 * @param {Object} response - Raw API response
 * @returns {Array} - Formatted comparable properties
 */
const formatComparableRentalsResponse = (response) => {
  // Transform the Rentcast API response to match our application's data structure
  return response.properties.map(property => ({
    address: property.address,
    distance: `${property.distance.toFixed(1)} miles`,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFootage,
    rent: property.rent,
    leaseStartDate: property.leaseStartDate,
    propertyType: property.propertyType
  }));
};

/**
 * Calculate financial metrics based on monthly rent
 * 
 * @param {number} monthlyRent - Estimated monthly rent
 * @returns {Object} - Financial metrics
 */
const calculateFinancials = (monthlyRent) => {
  const annualRent = monthlyRent * 12;
  const estimatedExpenses = annualRent * 0.4; // Assume 40% expenses
  const netOperatingIncome = annualRent - estimatedExpenses;
  const propertyValue = monthlyRent * 150; // Assume property value is 150x monthly rent
  const capRate = (netOperatingIncome / propertyValue) * 100;
  
  return {
    monthlyRent,
    annualRent,
    estimatedExpenses,
    netOperatingIncome,
    capRate: capRate.toFixed(2),
    propertyValue
  };
};

/**
 * Mock rental estimate for development/demo
 * 
 * @param {Object} propertyData - Property data
 * @returns {Promise} - Promise resolving to mock rental estimate
 */
const getMockRentalEstimate = (propertyData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Calculate a realistic rental estimate based on property details
      const baseRent = 1500; // Base rent for a standard property
      const bedroomFactor = Number(propertyData.bedrooms) * 200; // Each bedroom adds $200
      const bathroomFactor = Number(propertyData.bathrooms) * 150; // Each bathroom adds $150
      const sizeFactor = Number(propertyData.squareFeet) * 0.2; // Each sq ft adds $0.20
      
      // Adjust for property type
      const propertyTypeFactor = 
        propertyData.propertyType === 'luxury' ? 1.5 :
        propertyData.propertyType === 'apartment' ? 0.8 :
        propertyData.propertyType === 'condo' ? 1.2 : 1;
      
      // Calculate estimated rent
      const estimatedRent = Math.round((baseRent + bedroomFactor + bathroomFactor + sizeFactor) * propertyTypeFactor);
      
      // Add some variance for min/max
      const rentRangeLow = Math.round(estimatedRent * 0.9);
      const rentRangeHigh = Math.round(estimatedRent * 1.1);
      
      // Calculate financials
      const financials = calculateFinancials(estimatedRent);
      
      // Generate mock comparable properties
      const comparableProperties = getMockComparableProperties(propertyData, estimatedRent);
      
      resolve({
        address: propertyData.address,
        estimatedRent,
        rentRangeLow,
        rentRangeHigh,
        confidence: 'high',
        comparableProperties,
        financials
      });
    }, 1500);
  });
};

/**
 * Generate mock comparable properties
 * 
 * @param {Object} propertyData - Original property data
 * @param {number} baseRent - Base rent amount
 * @returns {Array} - Array of comparable properties
 */
const getMockComparableProperties = (propertyData, baseRent) => {
  return [
    {
      address: '123 Nearby St',
      distance: '0.5 miles',
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFeet: Math.round(Number(propertyData.squareFeet) * 0.95),
      rent: Math.round(baseRent * 0.97)
    },
    {
      address: '456 Close Ave',
      distance: '0.8 miles',
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFeet: Math.round(Number(propertyData.squareFeet) * 1.05),
      rent: Math.round(baseRent * 1.03)
    },
    {
      address: '789 Similar Ln',
      distance: '1.2 miles',
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      squareFeet: Math.round(Number(propertyData.squareFeet) * 0.98),
      rent: Math.round(baseRent * 0.99)
    }
  ];
};

/**
 * Mock comparable rentals for development/demo
 * 
 * @param {string} address - Property address
 * @param {number} radius - Search radius
 * @returns {Promise} - Promise resolving to mock comparable rentals
 */
const getMockComparableRentals = (address, radius) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          address: '123 Nearby St',
          distance: '0.5 miles',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1450,
          rent: 2200,
          leaseStartDate: '2023-01-15',
          propertyType: 'SFH'
        },
        {
          address: '456 Close Ave',
          distance: '0.8 miles',
          bedrooms: 3,
          bathrooms: 2.5,
          squareFeet: 1650,
          rent: 2400,
          leaseStartDate: '2023-02-01',
          propertyType: 'SFH'
        },
        {
          address: '789 Similar Ln',
          distance: '1.2 miles',
          bedrooms: 4,
          bathrooms: 2,
          squareFeet: 1800,
          rent: 2600,
          leaseStartDate: '2023-03-10',
          propertyType: 'SFH'
        }
      ]);
    }, 1000);
  });
};
