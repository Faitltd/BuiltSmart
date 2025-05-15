// Mock email service for sending estimates

/**
 * Send an estimate to the specified email address
 * @param emailAddress The email address to send the estimate to
 * @param estimateData The estimate data to send
 * @returns A promise that resolves to a success message
 */
export const sendEstimateEmail = async (
  emailAddress: string,
  estimateData: any
): Promise<string> => {
  // In a real implementation, this would use a service like SendGrid, Mailgun, etc.
  // For now, just log the email details
  console.log(`Sending estimate to ${emailAddress}`);
  console.log('Estimate data:', JSON.stringify(estimateData, null, 2));
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a success message
  return `Estimate sent to ${emailAddress}`;
};

/**
 * Generate a PDF of the estimate
 * @param estimateData The estimate data to convert to PDF
 * @returns A promise that resolves to a buffer containing the PDF
 */
export const generateEstimatePdf = async (estimateData: any): Promise<Buffer> => {
  // In a real implementation, this would use a library like PDFKit to generate a PDF
  // For now, just return a mock buffer
  console.log('Generating PDF for estimate');
  console.log('Estimate data:', JSON.stringify(estimateData, null, 2));
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock buffer
  return Buffer.from('Mock PDF content');
};

/**
 * Format the estimate data for display in an email
 * @param estimateData The estimate data to format
 * @returns A string containing the formatted estimate
 */
export const formatEstimateForEmail = (estimateData: any): string => {
  // In a real implementation, this would generate HTML for the email
  // For now, just return a simple text representation
  
  let emailContent = `
FAIT ESTIMATE SUMMARY

Project Overview:
----------------
`;

  // Add rooms
  if (estimateData.rooms && estimateData.rooms.length > 0) {
    emailContent += `\nRooms:\n`;
    
    let totalLaborCost = 0;
    let totalProductCost = 0;
    
    estimateData.rooms.forEach((room: any, index: number) => {
      // Calculate room costs (mock values for now)
      const laborCost = room.dimensions?.squareFootage ? room.dimensions.squareFootage * 50 : 1000;
      const productCost = 2000; // Mock value
      
      totalLaborCost += laborCost;
      totalProductCost += productCost;
      
      emailContent += `
Room ${index + 1}: ${room.type}
- Dimensions: ${room.dimensions ? 
  `${room.dimensions.length || 0}' x ${room.dimensions.width || 0}' = ${room.dimensions.squareFootage || 0} sq ft` : 
  'Not specified'}
- Products: ${room.products?.join(', ') || 'None selected'}
- Labor Cost: $${laborCost.toLocaleString()}
- Product Cost: $${productCost.toLocaleString()}
- Room Total: $${(laborCost + productCost).toLocaleString()}
`;
    });
    
    // Add total
    emailContent += `
Project Totals:
--------------
- Total Labor: $${totalLaborCost.toLocaleString()}
- Total Products: $${totalProductCost.toLocaleString()}
- Project Grand Total: $${(totalLaborCost + totalProductCost).toLocaleString()}
`;
  }
  
  // Add footer
  emailContent += `
Thank you for using FAIT Estimate Builder!
For questions or to schedule a consultation, please contact us at support@fait.com.
`;
  
  return emailContent;
};
