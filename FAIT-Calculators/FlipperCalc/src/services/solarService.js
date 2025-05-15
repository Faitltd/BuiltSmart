/**
 * Solar Analysis Service
 *
 * This service handles interactions with the NREL Solar Resource Data API.
 * Documentation: https://developer.nrel.gov/docs/solar/solar-resource-v1/
 */

// NREL API key from environment variables
const NREL_API_KEY = process.env.REACT_APP_NREL_API_KEY || 'DEMO_KEY';
const NREL_BASE_URL = 'https://developer.nrel.gov/api/solar/solar_resource/v1.json';

/**
 * Get solar resource data for a location
 *
 * @param {Object} location - Location data
 * @param {number} location.latitude - Latitude of the location
 * @param {number} location.longitude - Longitude of the location
 * @returns {Promise} - Promise resolving to solar resource data
 */
export const getSolarResourceData = async (location) => {
  try {
    // For development/demo purposes, use the mock API
    if (process.env.REACT_APP_USE_MOCK_API === 'true') {
      return getMockSolarData(location);
    }

    // For production, use the real NREL API
    const url = `${NREL_BASE_URL}?api_key=${NREL_API_KEY}&lat=${location.latitude}&lon=${location.longitude}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch solar resource data');
    }

    const data = await response.json();
    return formatSolarResponse(data);
  } catch (error) {
    console.error('Error fetching solar resource data:', error);
    throw error;
  }
};

/**
 * Format NREL API response
 *
 * @param {Object} response - Raw API response
 * @returns {Object} - Formatted response for UI
 */
const formatSolarResponse = (response) => {
  // Transform the NREL API response to match our application's data structure
  return {
    annualData: {
      avgDNI: response.outputs.avg_dni.annual,
      avgGHI: response.outputs.avg_ghi.annual,
      avgLatTilt: response.outputs.avg_lat_tilt.annual
    },
    monthlyData: {
      avgDNI: response.outputs.avg_dni.monthly,
      avgGHI: response.outputs.avg_ghi.monthly,
      avgLatTilt: response.outputs.avg_lat_tilt.monthly
    },
    metadata: response.metadata,
    location: {
      latitude: parseFloat(response.inputs.lat),
      longitude: parseFloat(response.inputs.lon)
    }
  };
};

/**
 * Calculate solar potential and savings
 *
 * @param {Object} solarData - Solar resource data
 * @param {Object} propertyData - Property data
 * @returns {Object} - Solar potential and savings data
 */
export const calculateSolarPotential = (solarData, propertyData) => {
  // Get annual average solar radiation (kWh/m²/day)
  const annualSolarRadiation = solarData.annualData.avgLatTilt;

  // Calculate system size based on roof area and efficiency
  // Assume 15 sq ft per 1 kW of solar panels
  const availableRoofArea = propertyData.roofArea || 500; // Default to 500 sq ft if not provided
  const systemSizeKW = Math.floor(availableRoofArea / 15);

  // Calculate annual energy production
  // Formula: System Size (kW) × Solar Radiation (kWh/m²/day) × 365 days × Performance Ratio (0.75)
  const performanceRatio = 0.75; // Industry standard for residential systems
  const annualEnergyProduction = systemSizeKW * annualSolarRadiation * 365 * performanceRatio;

  // Calculate financial metrics
  const electricityRate = propertyData.electricityRate || 0.13; // Default to $0.13/kWh if not provided
  const annualSavings = annualEnergyProduction * electricityRate;

  // Installation cost (national average is about $3 per watt)
  const installationCost = systemSizeKW * 1000 * 3;

  // Federal tax credit (26% for 2022)
  const federalTaxCredit = installationCost * 0.26;
  const netCost = installationCost - federalTaxCredit;

  // Payback period
  const paybackPeriod = netCost / annualSavings;

  // 25-year savings (assuming 2.5% annual electricity price increase)
  let totalSavings = 0;
  let currentRate = electricityRate;
  for (let year = 1; year <= 25; year++) {
    totalSavings += annualEnergyProduction * currentRate;
    currentRate *= 1.025; // 2.5% annual increase
  }

  // Return calculated values
  return {
    systemSizeKW,
    annualEnergyProduction,
    annualSavings,
    installationCost,
    federalTaxCredit,
    netCost,
    paybackPeriod,
    totalSavings,
    roi: (totalSavings - netCost) / netCost * 100
  };
};

/**
 * Get solar viability rating
 *
 * @param {Object} solarData - Solar resource data
 * @param {Object} potentialData - Solar potential data
 * @returns {Object} - Viability rating and recommendations
 */
export const getSolarViability = (solarData, potentialData) => {
  // Determine viability based on solar radiation and payback period
  const annualSolarRadiation = solarData.annualData.avgLatTilt;
  const { paybackPeriod, roi } = potentialData;

  let viabilityScore = 0;
  let viabilityRating = '';
  let recommendations = [];

  // Score based on solar radiation (0-40 points)
  if (annualSolarRadiation >= 6) {
    viabilityScore += 40;
  } else if (annualSolarRadiation >= 5) {
    viabilityScore += 30;
  } else if (annualSolarRadiation >= 4) {
    viabilityScore += 20;
  } else if (annualSolarRadiation >= 3) {
    viabilityScore += 10;
  }

  // Score based on payback period (0-40 points)
  if (paybackPeriod <= 7) {
    viabilityScore += 40;
  } else if (paybackPeriod <= 10) {
    viabilityScore += 30;
  } else if (paybackPeriod <= 15) {
    viabilityScore += 20;
  } else if (paybackPeriod <= 20) {
    viabilityScore += 10;
  }

  // Score based on ROI (0-20 points)
  if (roi >= 200) {
    viabilityScore += 20;
  } else if (roi >= 150) {
    viabilityScore += 15;
  } else if (roi >= 100) {
    viabilityScore += 10;
  } else if (roi >= 50) {
    viabilityScore += 5;
  }

  // Determine rating and recommendations
  if (viabilityScore >= 80) {
    viabilityRating = 'Excellent';
    recommendations = [
      'Highly recommended for solar installation',
      'Consider maximizing system size for best returns',
      'Explore battery storage options for additional benefits'
    ];
  } else if (viabilityScore >= 60) {
    viabilityRating = 'Good';
    recommendations = [
      'Good candidate for solar installation',
      'Consider optimal system sizing to maximize ROI',
      'Explore available local incentives to improve returns'
    ];
  } else if (viabilityScore >= 40) {
    viabilityRating = 'Moderate';
    recommendations = [
      'Moderate potential for solar benefits',
      'Consider a smaller system to improve ROI',
      'Explore financing options with low interest rates'
    ];
  } else {
    viabilityRating = 'Low';
    recommendations = [
      'Limited potential for solar benefits',
      'Consider energy efficiency upgrades first',
      'Reassess in the future as technology improves and costs decrease'
    ];
  }

  return {
    viabilityScore,
    viabilityRating,
    recommendations
  };
};

/**
 * Mock solar resource data for development/demo
 *
 * @param {Object} location - Location data
 * @returns {Promise} - Promise resolving to mock solar data
 */
const getMockSolarData = (location) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate realistic solar data based on latitude
      const latitude = Math.abs(location.latitude);
      let baseValue = 0;

      // Higher solar radiation in lower latitudes (closer to equator)
      if (latitude < 25) {
        baseValue = 6.5;
      } else if (latitude < 35) {
        baseValue = 5.8;
      } else if (latitude < 45) {
        baseValue = 5.0;
      } else {
        baseValue = 4.2;
      }

      // Add some randomness
      const randomFactor = Math.random() * 0.5 - 0.25; // -0.25 to 0.25
      const adjustedBase = baseValue + randomFactor;

      // Create monthly data with seasonal variation
      const createMonthlyData = (base) => {
        return {
          jan: Math.round((base - 1.5 + Math.random() * 0.3) * 100) / 100,
          feb: Math.round((base - 1.0 + Math.random() * 0.3) * 100) / 100,
          mar: Math.round((base - 0.5 + Math.random() * 0.3) * 100) / 100,
          apr: Math.round((base + 0.0 + Math.random() * 0.3) * 100) / 100,
          may: Math.round((base + 0.5 + Math.random() * 0.3) * 100) / 100,
          jun: Math.round((base + 1.0 + Math.random() * 0.3) * 100) / 100,
          jul: Math.round((base + 1.0 + Math.random() * 0.3) * 100) / 100,
          aug: Math.round((base + 0.8 + Math.random() * 0.3) * 100) / 100,
          sep: Math.round((base + 0.3 + Math.random() * 0.3) * 100) / 100,
          oct: Math.round((base - 0.3 + Math.random() * 0.3) * 100) / 100,
          nov: Math.round((base - 1.0 + Math.random() * 0.3) * 100) / 100,
          dec: Math.round((base - 1.5 + Math.random() * 0.3) * 100) / 100
        };
      };

      resolve({
        annualData: {
          avgDNI: Math.round((adjustedBase + 1.2) * 100) / 100,
          avgGHI: Math.round(adjustedBase * 100) / 100,
          avgLatTilt: Math.round((adjustedBase + 0.8) * 100) / 100
        },
        monthlyData: {
          avgDNI: createMonthlyData(adjustedBase + 1.2),
          avgGHI: createMonthlyData(adjustedBase),
          avgLatTilt: createMonthlyData(adjustedBase + 0.8)
        },
        metadata: {
          sources: ["Mock Data for Development"]
        },
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
    }, 1000);
  });
};
