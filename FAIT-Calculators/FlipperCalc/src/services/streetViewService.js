/**
 * Street View Service
 * 
 * This service handles interactions with the Google Street View API
 * to fetch street view images for properties.
 */

/**
 * Get a Street View image URL for a specific location
 * 
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {number} size - The size of the image (default: 600x400)
 * @param {number} heading - The compass heading (0-360, default: 0 for north)
 * @param {number} pitch - The up/down angle (-90 to 90, default: 0)
 * @param {number} fov - Field of view (0-120, default: 90)
 * @returns {string} - The URL to the Street View image
 */
export const getStreetViewImageUrl = (
  latitude, 
  longitude, 
  size = '600x400', 
  heading = 0, 
  pitch = 0, 
  fov = 90
) => {
  const apiKey = process.env.REACT_APP_GOOGLE_STREETVIEW_API_KEY;
  
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;
};

/**
 * Get multiple Street View images for a location from different angles
 * 
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Array} - Array of image URLs from different angles
 */
export const getMultiAngleStreetViewImages = (latitude, longitude) => {
  // Get images from 4 different angles (0, 90, 180, 270 degrees)
  const angles = [0, 90, 180, 270];
  
  return angles.map(angle => ({
    url: getStreetViewImageUrl(latitude, longitude, '600x400', angle),
    angle
  }));
};

/**
 * Check if Street View is available for a location
 * 
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise} - Promise resolving to boolean indicating availability
 */
export const checkStreetViewAvailability = async (latitude, longitude) => {
  // For mock mode, always return true
  if (process.env.REACT_APP_USE_MOCK_API === 'true') {
    return Promise.resolve(true);
  }
  
  // In a real implementation, you would use the Street View API's metadata endpoint
  // to check if imagery is available for the location
  const apiKey = process.env.REACT_APP_GOOGLE_STREETVIEW_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${latitude},${longitude}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.status === 'OK';
  } catch (error) {
    console.error('Error checking Street View availability:', error);
    return false;
  }
};

/**
 * Get mock Street View data for testing
 * 
 * @param {string} propertyType - The type of property
 * @returns {Object} - Mock Street View data
 */
export const getMockStreetViewData = (propertyType = 'single-family') => {
  // Base URL for placeholder images
  const baseUrl = 'https://via.placeholder.com/600x400/';
  
  // Different colors for different property types
  const colors = {
    'single-family': '3498db/FFFFFF',
    'multi-family': '9b59b6/FFFFFF',
    'condo': '2ecc71/FFFFFF',
    'townhouse': 'e74c3c/FFFFFF'
  };
  
  const color = colors[propertyType] || colors['single-family'];
  
  // Generate mock images for different angles
  return [
    { url: `${baseUrl}${color}?text=Front+View+(0°)`, angle: 0 },
    { url: `${baseUrl}${color}?text=Side+View+(90°)`, angle: 90 },
    { url: `${baseUrl}${color}?text=Back+View+(180°)`, angle: 180 },
    { url: `${baseUrl}${color}?text=Side+View+(270°)`, angle: 270 }
  ];
};
