/**
 * Mock product data for the frontend to use while the backend is not fully functional
 */

export interface Product {
  id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  brand?: string;
  source?: string;
  url?: string;
  image_url?: string;
  tier?: 'good' | 'better' | 'best';
}

// Product categories
export const categories = [
  { id: 1, name: 'Cabinets' },
  { id: 2, name: 'Countertops' },
  { id: 3, name: 'Flooring' },
  { id: 4, name: 'Appliances' },
  { id: 5, name: 'Fixtures' },
  { id: 6, name: 'Lighting' },
  { id: 7, name: 'Doors' },
  { id: 8, name: 'Windows' },
  { id: 9, name: 'Paint' },
  { id: 10, name: 'Hardware' },
  { id: 11, name: 'Bathroom' },
  { id: 12, name: 'Kitchen' }
];

// Mock products
export const products: Product[] = [
  // Kitchen cabinets
  {
    id: '1001',
    category_id: 1,
    category_name: 'Cabinets',
    name: 'Shaker Style Kitchen Cabinets',
    description: 'Classic shaker style cabinets with clean lines and timeless appeal. Made from solid wood with a white finish.',
    price: 3200,
    brand: 'CabinetCraft',
    image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8a2l0Y2hlbiUyMGNhYmluZXRzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
    tier: 'good'
  },
  {
    id: '1002',
    category_id: 1,
    category_name: 'Cabinets',
    name: 'Modern Flat Panel Cabinets',
    description: 'Sleek flat panel cabinets with minimalist hardware. Perfect for contemporary kitchens. Available in multiple finishes.',
    price: 4500,
    brand: 'ModernHome',
    image_url: 'https://images.unsplash.com/photo-1556911220-bda9f7f6b6b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8a2l0Y2hlbiUyMGNhYmluZXRzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
    tier: 'better'
  },
  {
    id: '1003',
    category_id: 1,
    category_name: 'Cabinets',
    name: 'Custom Hardwood Cabinets',
    description: 'Premium custom cabinets made from your choice of hardwood. Includes soft-close hinges and dovetail drawer construction.',
    price: 7800,
    brand: 'LuxuryWood',
    image_url: 'https://images.unsplash.com/photo-1556909114-44e3e9399a2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8a2l0Y2hlbiUyMGNhYmluZXRzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
    tier: 'best'
  },
  
  // Countertops
  {
    id: '2001',
    category_id: 2,
    category_name: 'Countertops',
    name: 'Laminate Countertop',
    description: 'Affordable and durable laminate countertop with a wide range of colors and patterns.',
    price: 1200,
    brand: 'FormaTop',
    image_url: 'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y291bnRlcnRvcHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
    tier: 'good'
  },
  {
    id: '2002',
    category_id: 2,
    category_name: 'Countertops',
    name: 'Quartz Countertop',
    description: 'Engineered quartz countertop that combines beauty and durability. Resistant to stains and scratches.',
    price: 3500,
    brand: 'StoneWorks',
    image_url: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y291bnRlcnRvcHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
    tier: 'better'
  },
  {
    id: '2003',
    category_id: 2,
    category_name: 'Countertops',
    name: 'Marble Countertop',
    description: 'Luxurious natural marble countertop with unique veining patterns. Adds elegance to any kitchen.',
    price: 5800,
    brand: 'MarbleArt',
    image_url: 'https://images.unsplash.com/photo-1556909190-3552013fd72b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y291bnRlcnRvcHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
    tier: 'best'
  },
  
  // Bathroom fixtures
  {
    id: '11001',
    category_id: 11,
    category_name: 'Bathroom',
    name: 'Standard Bathroom Vanity',
    description: 'Basic bathroom vanity with sink and storage. Available in 24", 30", and 36" widths.',
    price: 450,
    brand: 'BathEssentials',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmF0aHJvb20lMjB2YW5pdHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    tier: 'good'
  },
  {
    id: '11002',
    category_id: 11,
    category_name: 'Bathroom',
    name: 'Modern Floating Vanity',
    description: 'Wall-mounted floating vanity with double sinks and soft-close drawers. Contemporary design.',
    price: 1200,
    brand: 'ModernBath',
    image_url: 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmF0aHJvb20lMjB2YW5pdHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    tier: 'better'
  },
  {
    id: '11003',
    category_id: 11,
    category_name: 'Bathroom',
    name: 'Luxury Bathroom Vanity Suite',
    description: 'Complete bathroom vanity suite with marble countertop, vessel sink, and custom cabinetry.',
    price: 2800,
    brand: 'LuxuryBath',
    image_url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmF0aHJvb20lMjB2YW5pdHl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    tier: 'best'
  }
];

// Function to search products
export const searchProducts = (
  query: string,
  categoryId?: number,
  tier?: string
): Product[] => {
  const lowerQuery = query.toLowerCase();
  
  return products.filter(product => {
    // Match by query text
    const matchesQuery = 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.category_name.toLowerCase().includes(lowerQuery);
    
    // Match by category if specified
    const matchesCategory = categoryId ? product.category_id === categoryId : true;
    
    // Match by tier if specified
    const matchesTier = tier ? product.tier === tier : true;
    
    return matchesQuery && matchesCategory && matchesTier;
  });
};
