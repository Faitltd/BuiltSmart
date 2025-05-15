/**
 * Remodeling cost data extracted from the Remodeling Calculator
 * This data provides cost ranges per square foot for different room types and quality levels
 */

export interface CostRate {
  low: number;
  high: number;
}

export interface RoomCostRates {
  [quality: string]: CostRate;
}

export interface RemodelingCosts {
  [roomType: string]: RoomCostRates;
}

// Pricing ranges for each renovation type (4 tiers)
export const remodelingCosts: RemodelingCosts = {
  "Primary Bedroom": {
    "Good": { low: 50, high: 100 },
    "Better": { low: 150, high: 200 },
    "Best": { low: 250, high: 300 },
    "Fully Custom": { low: 500, high: 800 }
  },
  "Guest Bedroom": {
    "Good": { low: 50, high: 100 },
    "Better": { low: 150, high: 200 },
    "Best": { low: 250, high: 300 },
    "Fully Custom": { low: 450, high: 700 }
  },
  "Half Bath Renovation": {
    "Good": { low: 200, high: 300 },
    "Better": { low: 300, high: 400 },
    "Best": { low: 400, high: 500 },
    "Fully Custom": { low: 600, high: 700 }
  },
  "Full Bath Renovation": {
    "Good": { low: 300, high: 450 },
    "Better": { low: 450, high: 600 },
    "Best": { low: 600, high: 750 },
    "Fully Custom": { low: 800, high: 900 }
  },
  "Kitchen / Dining": {
    "Good": { low: 125, high: 200 },
    "Better": { low: 200, high: 300 },
    "Best": { low: 300, high: 400 },
    "Fully Custom": { low: 500, high: 600 }
  },
  "Wet Bar": {
    "Good": { low: 200, high: 400 },
    "Better": { low: 400, high: 500 },
    "Best": { low: 500, high: 600 },
    "Fully Custom": { low: 700, high: 800 }
  },
  "Living Room": {
    "Good": { low: 50, high: 100 },
    "Better": { low: 100, high: 150 },
    "Best": { low: 150, high: 200 },
    "Fully Custom": { low: 250, high: 300 }
  },
  "Dining Room": {
    "Good": { low: 100, high: 150 },
    "Better": { low: 150, high: 200 },
    "Best": { low: 200, high: 250 },
    "Fully Custom": { low: 300, high: 350 }
  },
  "Home Gym": {
    "Good": { low: 50, high: 100 },
    "Better": { low: 100, high: 150 },
    "Best": { low: 150, high: 200 },
    "Fully Custom": { low: 250, high: 300 }
  },
  "Closet": {
    "Good": { low: 75, high: 125 },
    "Better": { low: 125, high: 175 },
    "Best": { low: 175, high: 225 },
    "Fully Custom": { low: 250, high: 300 }
  },
  "Utility Room": {
    "Good": { low: 50, high: 100 },
    "Better": { low: 100, high: 150 },
    "Best": { low: 150, high: 200 },
    "Fully Custom": { low: 200, high: 250 }
  },
  "Hallways / Stairs": {
    "Good": { low: 20, high: 50 },
    "Better": { low: 50, high: 80 },
    "Best": { low: 80, high: 110 },
    "Fully Custom": { low: 120, high: 140 }
  }
};

// Design catalog–style descriptors
export interface RoomDescriptors {
  [quality: string]: string;
}

export interface Descriptors {
  [roomType: string]: RoomDescriptors;
}

export const roomDescriptors: Descriptors = {
  "Primary Bedroom": {
    "Good": "<ul><li>Designer-selected paint palette with satin finish</li><li>Efficiently organized wardrobe with soft-close hardware</li><li>Engineered hardwood flooring</li><li>LED lighting with dimmers</li><li>Modern ceiling fan</li></ul>",
    "Better": "<ul><li>Custom wall treatments and molding</li><li>Integrated closet systems with LED lighting</li><li>Premium hardwood flooring</li><li>Motorized window treatments</li><li>Smart home integration</li></ul>",
    "Best": "<ul><li>Custom millwork and storage solutions</li><li>Walk-in dressing suite</li><li>Heated floors and premium finishes</li><li>Smart home climate and lighting controls</li><li>Concealed home theater system</li></ul>",
    "Fully Custom": "<ul><li>Completely bespoke design</li><li>Rare luxury materials and finishes</li><li>Fully integrated smart home technology</li><li>One-of-a-kind architectural elements</li></ul>"
  },
  "Guest Bedroom": {
    "Good": "<ul><li>Standard quality materials and finishes</li><li>Practical design elements</li><li>Energy efficient lighting</li><li>Durable surfaces</li></ul>",
    "Better": "<ul><li>Premium quality materials</li><li>Enhanced design elements</li><li>Custom lighting solutions</li><li>Upgraded fixtures and finishes</li></ul>",
    "Best": "<ul><li>High-end materials and finishes</li><li>Custom design elements</li><li>Smart home integration</li><li>Luxury fixtures and hardware</li></ul>",
    "Fully Custom": "<ul><li>Completely bespoke design</li><li>One-of-a-kind solutions</li><li>Artisan craftsmanship</li><li>Rare and exclusive materials</li></ul>"
  },
  "Half Bath Renovation": {
    "Good": "<ul><li>Standard fixtures and finishes</li><li>Basic tile work</li><li>Stock vanity and mirror</li><li>Standard lighting</li></ul>",
    "Better": "<ul><li>Semi-custom vanity</li><li>Quality fixtures</li><li>Upgraded tile work</li><li>Designer lighting</li></ul>",
    "Best": "<ul><li>Custom vanity</li><li>Premium fixtures</li><li>Custom tile patterns</li><li>High-end lighting</li><li>Smart features</li></ul>",
    "Fully Custom": "<ul><li>Bespoke cabinetry</li><li>Luxury fixtures</li><li>Artisan tile work</li><li>Custom lighting design</li><li>Integrated technology</li></ul>"
  },
  "Full Bath Renovation": {
    "Good": "<ul><li>Standard fixtures and finishes</li><li>Basic tile work</li><li>Stock vanity and mirror</li><li>Standard lighting</li><li>Basic shower/tub</li></ul>",
    "Better": "<ul><li>Semi-custom vanity</li><li>Quality fixtures</li><li>Upgraded tile work</li><li>Designer lighting</li><li>Glass shower enclosure</li></ul>",
    "Best": "<ul><li>Custom vanity</li><li>Premium fixtures</li><li>Custom tile patterns</li><li>High-end lighting</li><li>Luxury shower system</li><li>Heated floors</li></ul>",
    "Fully Custom": "<ul><li>Bespoke cabinetry</li><li>Luxury fixtures</li><li>Artisan tile work</li><li>Custom lighting design</li><li>Steam shower</li><li>Smart technology</li></ul>"
  }
};

// Default descriptors for all room types
for (const room in remodelingCosts) {
  if (!roomDescriptors[room]) {
    roomDescriptors[room] = {
      "Good": "<ul><li>Standard quality materials and finishes</li><li>Practical design elements</li><li>Energy efficient lighting</li><li>Durable surfaces</li></ul>",
      "Better": "<ul><li>Premium quality materials</li><li>Enhanced design elements</li><li>Custom lighting solutions</li><li>Upgraded fixtures and finishes</li></ul>",
      "Best": "<ul><li>High-end materials and finishes</li><li>Custom design elements</li><li>Smart home integration</li><li>Luxury fixtures and hardware</li></ul>",
      "Fully Custom": "<ul><li>Completely bespoke design</li><li>One-of-a-kind solutions</li><li>Artisan craftsmanship</li><li>Rare and exclusive materials</li></ul>"
    };
  }
}
