/**
 * Mock Home Depot product data for the BuildSmart application
 * This simulates product data that would normally come from an API
 */

import { ProductCategory, DesignStyle, RoomType } from '../utils/conversationFlow';

export interface HomeDepotProduct {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  description: string;
  features: string[];
  roomTypes: RoomType[];
  designStyles: DesignStyle[];
  imageUrl: string;
  productUrl: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

// Mock Home Depot products
export const homeDepotProducts: HomeDepotProduct[] = [
  // Flooring
  {
    id: 'HD-F001',
    name: 'Pergo Outlast+ Vintage Pewter Oak Laminate Flooring',
    brand: 'Pergo',
    category: ProductCategory.FLOORING,
    price: 2.99,
    description: 'Waterproof laminate flooring with a realistic oak look. Easy to install with SpillProtect technology.',
    features: ['Waterproof', 'Scratch resistant', 'Easy installation', '10mm thickness'],
    roomTypes: [RoomType.KITCHEN, RoomType.LIVING_ROOM, RoomType.DINING_ROOM, RoomType.BEDROOM],
    designStyles: [DesignStyle.MODERN, DesignStyle.TRANSITIONAL, DesignStyle.CONTEMPORARY],
    imageUrl: 'https://images.thdstatic.com/productImages/1f5b78c9-7e76-4d1c-b9a8-7a60f89e4955/svn/vintage-pewter-oak-pergo-laminate-wood-flooring-lf000987-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/Pergo-Outlast-Vintage-Pewter-Oak-10-mm-T-x-7-48-in-W-x-47-24-in-L-Waterproof-Laminate-Flooring-19-63-sq-ft-case-LF000987/308572663',
    rating: 4.5,
    reviewCount: 1250,
    inStock: true
  },
  {
    id: 'HD-F002',
    name: 'LifeProof Luxury Vinyl Plank Flooring - Sterling Oak',
    brand: 'LifeProof',
    category: ProductCategory.FLOORING,
    price: 3.79,
    description: 'Waterproof luxury vinyl plank flooring with a realistic wood look. Perfect for any room in your home.',
    features: ['100% waterproof', 'Pet-friendly', 'Scratch and dent resistant', 'Easy installation'],
    roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM, RoomType.LIVING_ROOM, RoomType.BEDROOM, RoomType.BASEMENT],
    designStyles: [DesignStyle.MODERN, DesignStyle.TRANSITIONAL, DesignStyle.CONTEMPORARY, DesignStyle.FARMHOUSE],
    imageUrl: 'https://images.thdstatic.com/productImages/99095c65-3da7-430d-a052-0c10b4285c1b/svn/sterling-oak-lifeproof-vinyl-plank-flooring-i96711l-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/LifeProof-Sterling-Oak-8-7-in-W-x-47-6-in-L-Luxury-Vinyl-Plank-Flooring-20-06-sq-ft-case-I96711L/300699284',
    rating: 4.7,
    reviewCount: 3200,
    inStock: true
  },
  
  // Cabinets
  {
    id: 'HD-C001',
    name: 'Hampton Bay Shaker Assembled Kitchen Cabinet - Satin White',
    brand: 'Hampton Bay',
    category: ProductCategory.CABINETS,
    price: 249.00,
    description: 'Pre-assembled shaker style cabinet with soft-close doors and drawers. Made from solid wood with a durable white finish.',
    features: ['Soft-close hinges', 'Dovetail drawer construction', 'Adjustable shelves', 'Solid wood construction'],
    roomTypes: [RoomType.KITCHEN],
    designStyles: [DesignStyle.TRADITIONAL, DesignStyle.TRANSITIONAL, DesignStyle.FARMHOUSE],
    imageUrl: 'https://images.thdstatic.com/productImages/e8f95a2a-6c8c-4cce-b3c5-7c0c7c9a9d1c/svn/satin-white-hampton-bay-assembled-kitchen-cabinets-kb36-sw-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/Hampton-Bay-Shaker-Assembled-36x34-5x24-in-Base-Kitchen-Cabinet-with-Ball-Bearing-Drawer-Glides-in-Satin-White-KB36-SW/203565107',
    rating: 4.3,
    reviewCount: 850,
    inStock: true
  },
  {
    id: 'HD-C002',
    name: 'Cambridge Wall Cabinet - Espresso',
    brand: 'Cambridge',
    category: ProductCategory.CABINETS,
    price: 179.00,
    description: 'Modern espresso wall cabinet with glass doors. Perfect for displaying dishes or decorative items.',
    features: ['Glass doors', 'Adjustable shelves', 'Easy installation', 'Durable finish'],
    roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM],
    designStyles: [DesignStyle.MODERN, DesignStyle.CONTEMPORARY],
    imageUrl: 'https://images.thdstatic.com/productImages/7d9a8e9b-1c7d-4a95-8f1d-9359f931aec9/svn/espresso-cambridge-assembled-kitchen-cabinets-w3030-e-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/Cambridge-Assembled-30x30x12-in-Wall-Cabinet-in-Espresso-W3030-E/206616586',
    rating: 4.1,
    reviewCount: 420,
    inStock: true
  },
  
  // Countertops
  {
    id: 'HD-CT001',
    name: 'Silestone Quartz Countertop - Calacatta Gold',
    brand: 'Silestone',
    category: ProductCategory.COUNTERTOPS,
    price: 75.00,
    description: 'Premium quartz countertop with the look of Calacatta marble. Resistant to stains, scratches, and heat.',
    features: ['Stain resistant', 'Scratch resistant', 'Heat resistant', 'Non-porous'],
    roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM],
    designStyles: [DesignStyle.MODERN, DesignStyle.CONTEMPORARY, DesignStyle.TRANSITIONAL],
    imageUrl: 'https://images.thdstatic.com/productImages/0b1d3c5e-9b7c-4b2a-a5fb-e7b7b9d1c0a1/svn/calacatta-gold-silestone-countertops-012523-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/Silestone-3-in-x-5-in-Quartz-Countertop-Sample-in-Calacatta-Gold-SS-Q0720/206497352',
    rating: 4.8,
    reviewCount: 320,
    inStock: true
  },
  {
    id: 'HD-CT002',
    name: 'Formica Laminate Countertop - Carrara Bianco',
    brand: 'Formica',
    category: ProductCategory.COUNTERTOPS,
    price: 29.99,
    description: 'Affordable laminate countertop with the look of marble. Easy to clean and maintain.',
    features: ['Affordable', 'Easy to clean', 'Stain resistant', 'Variety of edge options'],
    roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM],
    designStyles: [DesignStyle.TRADITIONAL, DesignStyle.TRANSITIONAL, DesignStyle.FARMHOUSE],
    imageUrl: 'https://images.thdstatic.com/productImages/1b9c2b3e-8f1d-4a95-9359-f931aec9e7d9/svn/carrara-bianco-formica-countertops-034601258408000-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/FORMICA-4-ft-x-8-ft-Laminate-Sheet-in-Carrara-Bianco-with-Etchings-Finish-034601258408000/202911018',
    rating: 4.2,
    reviewCount: 580,
    inStock: true
  },
  
  // Fixtures
  {
    id: 'HD-FX001',
    name: 'Delta Trinsic Single-Handle Pull-Down Kitchen Faucet - Matte Black',
    brand: 'Delta',
    category: ProductCategory.FIXTURES,
    price: 299.00,
    description: 'Modern pull-down kitchen faucet with Touch2O technology. Allows you to turn water on and off with a touch.',
    features: ['Touch2O technology', 'Magnetic docking spray head', 'Easy installation', 'Lifetime warranty'],
    roomTypes: [RoomType.KITCHEN],
    designStyles: [DesignStyle.MODERN, DesignStyle.CONTEMPORARY, DesignStyle.MINIMALIST],
    imageUrl: 'https://images.thdstatic.com/productImages/9d9a8e9b-1c7d-4a95-8f1d-9359f931aec9/svn/matte-black-delta-kitchen-faucets-9159-bl-dst-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/Delta-Trinsic-Single-Handle-Pull-Down-Sprayer-Kitchen-Faucet-with-Touch2O-Technology-in-Matte-Black-9159T-BL-DST/206601272',
    rating: 4.6,
    reviewCount: 950,
    inStock: true
  },
  {
    id: 'HD-FX002',
    name: 'Kohler Devonshire Bathroom Sink Faucet - Brushed Nickel',
    brand: 'Kohler',
    category: ProductCategory.FIXTURES,
    price: 149.00,
    description: 'Traditional style bathroom faucet with a timeless design. Features a ceramic disc valve for durability.',
    features: ['Ceramic disc valve', 'Easy installation', 'WaterSense certified', 'Corrosion resistant'],
    roomTypes: [RoomType.BATHROOM, RoomType.MASTER_BATHROOM],
    designStyles: [DesignStyle.TRADITIONAL, DesignStyle.TRANSITIONAL],
    imageUrl: 'https://images.thdstatic.com/productImages/e8f95a2a-6c8c-4cce-b3c5-7c0c7c9a9d1c/svn/brushed-nickel-kohler-bathroom-sink-faucets-r76255-4d-bn-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/KOHLER-Devonshire-4-in-Centerset-2-Handle-Water-Saving-Bathroom-Faucet-in-Vibrant-Brushed-Nickel-R76255-4D-BN/202911018',
    rating: 4.5,
    reviewCount: 780,
    inStock: true
  },
  
  // Lighting
  {
    id: 'HD-L001',
    name: 'Hampton Bay LED Flush Mount Ceiling Light - Brushed Nickel',
    brand: 'Hampton Bay',
    category: ProductCategory.LIGHTING,
    price: 49.99,
    description: 'Energy-efficient LED ceiling light with a modern design. Provides bright, even illumination.',
    features: ['Energy efficient', 'Dimmable', 'Easy installation', '50,000 hour lifespan'],
    roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM, RoomType.BEDROOM, RoomType.LIVING_ROOM],
    designStyles: [DesignStyle.MODERN, DesignStyle.CONTEMPORARY, DesignStyle.TRANSITIONAL],
    imageUrl: 'https://images.thdstatic.com/productImages/7d9a8e9b-1c7d-4a95-8f1d-9359f931aec9/svn/brushed-nickel-hampton-bay-flush-mount-lights-54616101-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/Hampton-Bay-11-in-1-Light-Brushed-Nickel-LED-Flush-Mount-with-Frosted-White-Glass-Shade-54616101/301259087',
    rating: 4.4,
    reviewCount: 1120,
    inStock: true
  },
  {
    id: 'HD-L002',
    name: 'Progress Lighting Pendant Light - Bronze',
    brand: 'Progress Lighting',
    category: ProductCategory.LIGHTING,
    price: 129.00,
    description: 'Stylish pendant light with a bronze finish. Perfect for kitchen islands or dining areas.',
    features: ['Adjustable height', 'Dimmable', 'Compatible with sloped ceilings', 'Vintage-inspired design'],
    roomTypes: [RoomType.KITCHEN, RoomType.DINING_ROOM],
    designStyles: [DesignStyle.FARMHOUSE, DesignStyle.RUSTIC, DesignStyle.TRADITIONAL],
    imageUrl: 'https://images.thdstatic.com/productImages/0b1d3c5e-9b7c-4b2a-a5fb-e7b7b9d1c0a1/svn/antique-bronze-progress-lighting-pendant-lights-p5008-20-64_1000.jpg',
    productUrl: 'https://www.homedepot.com/p/Progress-Lighting-Trestle-Collection-1-Light-Antique-Bronze-Pendant-with-Clear-Seeded-Glass-P5008-20/206597802',
    rating: 4.7,
    reviewCount: 650,
    inStock: true
  }
];

/**
 * Search for Home Depot products based on various criteria
 */
export const searchHomeDepotProducts = (
  query: string = '',
  filters: {
    category?: ProductCategory;
    roomType?: RoomType;
    designStyle?: DesignStyle;
    priceRange?: { min: number; max: number };
    brand?: string;
  } = {}
): HomeDepotProduct[] => {
  return homeDepotProducts.filter(product => {
    // Match by search query
    const matchesQuery = !query || 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase());
    
    // Match by category
    const matchesCategory = !filters.category || product.category === filters.category;
    
    // Match by room type
    const matchesRoomType = !filters.roomType || product.roomTypes.includes(filters.roomType);
    
    // Match by design style
    const matchesDesignStyle = !filters.designStyle || product.designStyles.includes(filters.designStyle);
    
    // Match by price range
    const matchesPriceRange = !filters.priceRange || 
      (product.price >= filters.priceRange.min && product.price <= filters.priceRange.max);
    
    // Match by brand
    const matchesBrand = !filters.brand || product.brand.toLowerCase() === filters.brand.toLowerCase();
    
    return matchesQuery && matchesCategory && matchesRoomType && 
           matchesDesignStyle && matchesPriceRange && matchesBrand;
  });
};
