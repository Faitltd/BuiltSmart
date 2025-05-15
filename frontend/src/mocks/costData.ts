/**
 * Mock cost data for the frontend to use while the backend is not fully functional
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

export interface TaskPricing {
  label: string;
  unit: string;
  handyman: [number, number]; // [low, high]
  contractor: [number, number]; // [low, high]
}

export interface HandymanCosts {
  [taskKey: string]: TaskPricing;
}

// Pricing data from the handyman_pricing.py file
export const handymanCosts: HandymanCosts = {
  "drywall_repair": {
    "label": "Drywall patching and repair",
    "unit": "per job",
    "handyman": [200, 800],
    "contractor": [240, 900]
  },
  "touch_up_painting": {
    "label": "Touch-up painting",
    "unit": "per room",
    "handyman": [50, 150],
    "contractor": [60, 180]
  },
  "door_repair": {
    "label": "Door alignment and hinge repair",
    "unit": "per door",
    "handyman": [50, 100],
    "contractor": [60, 120]
  },
  "squeaky_fix": {
    "label": "Fixing squeaky doors or floors",
    "unit": "per room",
    "handyman": [50, 100],
    "contractor": [60, 120]
  },
  "caulking": {
    "label": "Caulking windows, tubs, and sinks",
    "unit": "per room",
    "handyman": [175, 300],
    "contractor": [210, 360]
  },
  "weather_stripping": {
    "label": "Replacing weather stripping",
    "unit": "per door/window",
    "handyman": [100, 400],
    "contractor": [120, 480]
  },
  "door_knobs": {
    "label": "Replacing door knobs and locks",
    "unit": "per unit",
    "handyman": [75, 200],
    "contractor": [90, 240]
  },
  "cabinet_hardware": {
    "label": "Tightening loose cabinet hardware",
    "unit": "per job",
    "handyman": [20, 50],
    "contractor": [30, 60]
  },
  "window_screens": {
    "label": "Replacing window screens",
    "unit": "per screen",
    "handyman": [15, 50],
    "contractor": [25, 70]
  },
  "tv_mounting": {
    "label": "Mounting TVs or soundbars",
    "unit": "per device",
    "handyman": [100, 300],
    "contractor": [120, 360]
  },
  "leaky_faucet": {
    "label": "Fixing leaky faucets",
    "unit": "per faucet",
    "handyman": [65, 150],
    "contractor": [80, 190]
  },
  "showerhead": {
    "label": "Replacing showerheads",
    "unit": "per head",
    "handyman": [75, 150],
    "contractor": [90, 190]
  }
};
