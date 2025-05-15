/**
 * Geocoding Service
 * 
 * This service handles converting addresses to geographic coordinates.
 * In a production environment, this would use a real geocoding API like Google Maps or Mapbox.
 */

/**
 * Convert an address to geographic coordinates
 * 
 * @param {string} address - The address to geocode
 * @returns {Promise} - Promise resolving to coordinates {latitude, longitude}
 */
export const geocodeAddress = async (address) => {
  try {
    // For development/demo purposes, use the mock geocoding
    if (process.env.REACT_APP_USE_MOCK_API === 'true') {
      return getMockGeocode(address);
    }
    
    // For production, use a real geocoding API
    // This is a placeholder for a real API call
    // Example using Google Maps Geocoding API:
    /*
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('No results found for this address');
    }
    
    const location = data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: data.results[0].formatted_address
    };
    */
    
    // Fallback to mock geocoding if no API is configured
    return getMockGeocode(address);
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

/**
 * Mock geocoding for development/demo
 * 
 * @param {string} address - The address to geocode
 * @returns {Promise} - Promise resolving to mock coordinates
 */
const getMockGeocode = (address) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extract any numbers from the address to create semi-realistic coordinates
      const numbers = address.match(/\d+/g);
      let seed = 0;
      if (numbers && numbers.length > 0) {
        // Use the first number in the address as a seed
        seed = parseInt(numbers[0]) % 100;
      } else {
        // If no numbers, use the length of the address
        seed = address.length % 100;
      }
      
      // Generate coordinates based on the address
      // This creates different but realistic coordinates for different addresses
      
      // For US-like coordinates (roughly)
      const baseLat = 37.0902; // Roughly middle of US
      const baseLng = -95.7129;
      
      // Add some variation based on the seed
      const latVariation = (seed / 100) * 10 - 5; // -5 to 5 degrees
      const lngVariation = (seed / 100) * 20 - 10; // -10 to 10 degrees
      
      // Check if the address contains certain keywords to adjust the base location
      const lowerAddress = address.toLowerCase();
      
      let adjustedLat = baseLat;
      let adjustedLng = baseLng;
      
      // Adjust for common US regions
      if (lowerAddress.includes('new york') || lowerAddress.includes('ny')) {
        adjustedLat = 40.7128;
        adjustedLng = -74.0060;
      } else if (lowerAddress.includes('los angeles') || lowerAddress.includes('la') || lowerAddress.includes('california')) {
        adjustedLat = 34.0522;
        adjustedLng = -118.2437;
      } else if (lowerAddress.includes('chicago') || lowerAddress.includes('illinois')) {
        adjustedLat = 41.8781;
        adjustedLng = -87.6298;
      } else if (lowerAddress.includes('houston') || lowerAddress.includes('texas')) {
        adjustedLat = 29.7604;
        adjustedLng = -95.3698;
      } else if (lowerAddress.includes('phoenix') || lowerAddress.includes('arizona')) {
        adjustedLat = 33.4484;
        adjustedLng = -112.0740;
      } else if (lowerAddress.includes('philadelphia') || lowerAddress.includes('pa')) {
        adjustedLat = 39.9526;
        adjustedLng = -75.1652;
      } else if (lowerAddress.includes('san') && lowerAddress.includes('francisco')) {
        adjustedLat = 37.7749;
        adjustedLng = -122.4194;
      } else if (lowerAddress.includes('boston') || lowerAddress.includes('massachusetts')) {
        adjustedLat = 42.3601;
        adjustedLng = -71.0589;
      } else if (lowerAddress.includes('seattle') || lowerAddress.includes('washington')) {
        adjustedLat = 47.6062;
        adjustedLng = -122.3321;
      } else if (lowerAddress.includes('denver') || lowerAddress.includes('colorado')) {
        adjustedLat = 39.7392;
        adjustedLng = -104.9903;
      }
      
      // Apply the variation to create unique coordinates
      const finalLat = adjustedLat + (latVariation / 10);
      const finalLng = adjustedLng + (lngVariation / 10);
      
      // Format the address nicely
      let formattedAddress = address;
      if (!address.match(/^\d+/)) {
        // If the address doesn't start with a number, add one
        formattedAddress = `${123 + seed} ${address}`;
      }
      
      // Add city, state, zip if not present
      if (!lowerAddress.includes('street') && !lowerAddress.includes('st') && 
          !lowerAddress.includes('avenue') && !lowerAddress.includes('ave') &&
          !lowerAddress.includes('road') && !lowerAddress.includes('rd')) {
        formattedAddress += ' Street';
      }
      
      if (!lowerAddress.includes('city') && !lowerAddress.includes('town') &&
          !lowerAddress.includes('village') && !lowerAddress.includes('york') &&
          !lowerAddress.includes('angeles') && !lowerAddress.includes('chicago') &&
          !lowerAddress.includes('houston') && !lowerAddress.includes('phoenix') &&
          !lowerAddress.includes('philadelphia') && !lowerAddress.includes('francisco') &&
          !lowerAddress.includes('boston') && !lowerAddress.includes('seattle') &&
          !lowerAddress.includes('denver')) {
        formattedAddress += ', Anytown';
      }
      
      if (!lowerAddress.includes('usa') && !lowerAddress.includes('states') &&
          !lowerAddress.includes('ny') && !lowerAddress.includes('ca') &&
          !lowerAddress.includes('il') && !lowerAddress.includes('tx') &&
          !lowerAddress.includes('az') && !lowerAddress.includes('pa') &&
          !lowerAddress.includes('ma') && !lowerAddress.includes('wa') &&
          !lowerAddress.includes('co')) {
        formattedAddress += ', USA';
      }
      
      resolve({
        latitude: parseFloat(finalLat.toFixed(6)),
        longitude: parseFloat(finalLng.toFixed(6)),
        formattedAddress: formattedAddress
      });
    }, 1000);
  });
};
