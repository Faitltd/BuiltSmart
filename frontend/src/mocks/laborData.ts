/**
 * Labor pricing data for remodeling projects
 * Includes square footage, hourly, and per-fixture/unit rates
 */

export interface LaborRate {
  id: number;
  name: string;
  description: string;
  unit: string;
  min_rate: number;
  max_rate: number;
  avg_rate: number;
  examples: {
    project: string;
    rate: number;
  }[];
}

export interface HourlyRate {
  id: number;
  name: string;
  description: string;
  min_rate: number;
  max_rate: number;
  examples: {
    project: string;
    rate: number;
  }[];
}

export interface FixtureRate {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  min_rate: number;
  max_rate: number;
  examples: {
    project: string;
    rate?: number;
  }[];
}

export const laborRates: LaborRate[] = [
  {
    id: 1,
    name: "Framing",
    description: "Structural framing for walls, ceilings, and other architectural elements",
    unit: "sq ft",
    min_rate: 3.25,
    max_rate: 3.75,
    avg_rate: 3.50,
    examples: [
      { project: "Welde", rate: 3.50 },
      { project: "Laris", rate: 3.25 },
      { project: "Richardson", rate: 3.75 }
    ]
  },
  {
    id: 2,
    name: "Drywall",
    description: "Installation and finishing of drywall/sheetrock",
    unit: "sq ft",
    min_rate: 1.90,
    max_rate: 2.25,
    avg_rate: 2.05,
    examples: [
      { project: "Welde", rate: 2.00 },
      { project: "Laris", rate: 1.90 },
      { project: "Richardson", rate: 2.25 }
    ]
  },
  {
    id: 3,
    name: "Paint",
    description: "Basic painting of walls and ceilings",
    unit: "sq ft",
    min_rate: 0.95,
    max_rate: 1.10,
    avg_rate: 1.00,
    examples: [
      { project: "Welde", rate: 1.00 },
      { project: "Laris", rate: 0.95 },
      { project: "Richardson", rate: 1.10 }
    ]
  },
  {
    id: 4,
    name: "Flooring (LVP or Vinyl)",
    description: "Installation of luxury vinyl plank or vinyl flooring",
    unit: "sq ft",
    min_rate: 1.75,
    max_rate: 2.50,
    avg_rate: 2.08,
    examples: [
      { project: "McAfee", rate: 1.75 },
      { project: "Laris", rate: 2.00 },
      { project: "Drew (Loney)", rate: 2.50 }
    ]
  },
  {
    id: 5,
    name: "Insulation",
    description: "Installation of wall, ceiling, or floor insulation",
    unit: "sq ft",
    min_rate: 1.00,
    max_rate: 1.50,
    avg_rate: 1.25,
    examples: [
      { project: "Laris", rate: 1.00 },
      { project: "Richardson", rate: 1.50 }
    ]
  },
  {
    id: 6,
    name: "Trim Install",
    description: "Installation of baseboards, crown molding, and other trim",
    unit: "sq ft",
    min_rate: 1.50,
    max_rate: 2.25,
    avg_rate: 2.00,
    examples: [
      { project: "Welde", rate: 1.75 },
      { project: "Szkatulski", rate: 2.00 },
      { project: "McAfee", rate: 2.25 }
    ]
  },
  {
    id: 7,
    name: "Tile Labor (Floor)",
    description: "Installation of floor tile",
    unit: "sq ft",
    min_rate: 10.00,
    max_rate: 12.50,
    avg_rate: 11.25,
    examples: [
      { project: "Regina", rate: 10.00 }
    ]
  },
  {
    id: 8,
    name: "Tile Labor (Shower)",
    description: "Installation of shower tile",
    unit: "sq ft",
    min_rate: 12.50,
    max_rate: 15.00,
    avg_rate: 13.75,
    examples: [
      { project: "Levinson", rate: 12.50 },
      { project: "Kaye", rate: 15.00 }
    ]
  },
  {
    id: 9,
    name: "Ceiling Finishing",
    description: "Finishing of ceilings, including texture and paint",
    unit: "sq ft",
    min_rate: 1.50,
    max_rate: 2.25,
    avg_rate: 1.88,
    examples: [
      { project: "Lewis", rate: 1.50 },
      { project: "TeBockhorst", rate: 2.25 }
    ]
  },
  {
    id: 10,
    name: "Paint Touch-up",
    description: "Touch-up painting and general finishing",
    unit: "sq ft",
    min_rate: 1.00,
    max_rate: 1.10,
    avg_rate: 1.05,
    examples: [
      { project: "Drew (Loney)", rate: 1.00 }
    ]
  },
  {
    id: 11,
    name: "Two-tone Paint",
    description: "Two-tone or accent wall painting",
    unit: "sq ft",
    min_rate: 1.10,
    max_rate: 1.20,
    avg_rate: 1.15,
    examples: [
      { project: "Karley", rate: 1.20 }
    ]
  }
];

/**
 * Calculate labor cost for a specific trade based on square footage
 * Always uses the highest rate as per client requirements
 *
 * @param tradeId The ID of the trade
 * @param squareFeet The square footage of the area
 * @returns The calculated labor cost
 */
export const calculateLaborCost = (
  tradeId: number,
  squareFeet: number
): number => {
  const trade = laborRates.find(rate => rate.id === tradeId);

  if (!trade) {
    throw new Error(`Trade with ID ${tradeId} not found`);
  }

  // Always use the highest rate for labor
  const rate = trade.max_rate;

  return rate * squareFeet;
};

// Hourly labor rates
export const hourlyRates: HourlyRate[] = [
  {
    id: 1,
    name: "General Labor",
    description: "General construction labor for smaller or custom tasks",
    min_rate: 60,
    max_rate: 75,
    examples: [
      { project: "Castillo", rate: 60 },
      { project: "Caverly", rate: 65 },
      { project: "Levinson", rate: 75 }
    ]
  },
  {
    id: 2,
    name: "Specialized Labor",
    description: "Specialized trades including plumbing, electrical, and HVAC",
    min_rate: 85,
    max_rate: 120,
    examples: [
      { project: "Jenny (Hanson)", rate: 85 },
      { project: "Karley (Paul)", rate: 100 },
      { project: "Szkatulski", rate: 120 }
    ]
  }
];

// Per fixture or per unit labor rates
export const fixtureRates: FixtureRate[] = [
  // Electrical
  {
    id: 1,
    name: "Can Lights Install",
    description: "Labor for installing recessed can lights",
    category: "Electrical",
    unit: "per light",
    min_rate: 100,
    max_rate: 125,
    examples: [
      { project: "McAfee", rate: 100 },
      { project: "Szkatulski", rate: 125 }
    ]
  },
  {
    id: 2,
    name: "Bath Fan",
    description: "Labor for installing bathroom exhaust fans",
    category: "Electrical",
    unit: "per fan",
    min_rate: 200,
    max_rate: 200,
    examples: [
      { project: "Levinson" },
      { project: "Kaye" }
    ]
  },

  // Plumbing
  {
    id: 3,
    name: "Toilet Install",
    description: "Labor for installing toilets",
    category: "Plumbing",
    unit: "per unit",
    min_rate: 200,
    max_rate: 250,
    examples: [
      { project: "Rental Shower" },
      { project: "Hadeel" }
    ]
  },
  {
    id: 4,
    name: "Vanity/Sink Install",
    description: "Labor for installing bathroom vanities and sinks",
    category: "Plumbing",
    unit: "per unit",
    min_rate: 250,
    max_rate: 300,
    examples: [
      { project: "Regina" },
      { project: "Drew" }
    ]
  },

  // Shower/Tub
  {
    id: 5,
    name: "Tile Shower",
    description: "Labor for installing custom tile showers (typically 40-60 sq ft)",
    category: "Shower/Tub",
    unit: "total",
    min_rate: 3000,
    max_rate: 4500,
    examples: [
      { project: "Various (~$75/sq ft when billed lump sum)" }
    ]
  },
  {
    id: 6,
    name: "Fiberglass Shower/Tub",
    description: "Labor for installing prefabricated fiberglass shower or tub units",
    category: "Shower/Tub",
    unit: "per unit",
    min_rate: 750,
    max_rate: 1200,
    examples: [
      { project: "Levinson" },
      { project: "Shower Estimate" },
      { project: "TeBockhorst" }
    ]
  },

  // Doors/Windows
  {
    id: 7,
    name: "Interior Door Install",
    description: "Labor for installing interior doors",
    category: "Doors/Windows",
    unit: "per door",
    min_rate: 150,
    max_rate: 200,
    examples: [
      { project: "Laris" },
      { project: "McAfee" },
      { project: "TeBockhorst" }
    ]
  },
  {
    id: 8,
    name: "Egress Window Install",
    description: "Labor for installing egress windows, including cutting foundation and well installation",
    category: "Doors/Windows",
    unit: "per window",
    min_rate: 2000,
    max_rate: 2500,
    examples: [
      { project: "Richardson" },
      { project: "Hanson" }
    ]
  }
];

/**
 * Get typical labor trades for a specific room type
 * @param roomType The type of room
 * @returns Array of trade IDs typically used for that room type
 */
export const getTypicalTradesForRoom = (roomType: string): number[] => {
  const roomType_lower = roomType.toLowerCase();

  // Common trades for all rooms
  const commonTrades = [2, 3]; // Drywall and Paint

  if (roomType_lower.includes('bathroom')) {
    return [...commonTrades, 1, 4, 6, 7, 8]; // Add Framing, Flooring, Trim, and Tile
  } else if (roomType_lower.includes('kitchen')) {
    return [...commonTrades, 1, 4, 6]; // Add Framing, Flooring, and Trim
  } else if (roomType_lower.includes('bedroom')) {
    return [...commonTrades, 4, 6, 9]; // Add Flooring, Trim, and Ceiling
  } else if (roomType_lower.includes('living')) {
    return [...commonTrades, 4, 6, 9]; // Add Flooring, Trim, and Ceiling
  } else if (roomType_lower.includes('basement')) {
    return [1, 2, 3, 4, 5, 6, 9]; // All major trades including insulation
  } else {
    return commonTrades; // Default to common trades
  }
};

/**
 * Get typical fixture items for a specific room type
 * @param roomType The type of room
 * @returns Array of fixture IDs typically used for that room type
 */
export const getTypicalFixturesForRoom = (roomType: string): number[] => {
  const roomType_lower = roomType.toLowerCase();

  if (roomType_lower.includes('bathroom')) {
    return [1, 2, 3, 4, 6]; // Can lights, bath fan, toilet, vanity, fiberglass shower
  } else if (roomType_lower.includes('kitchen')) {
    return [1]; // Can lights
  } else if (roomType_lower.includes('bedroom')) {
    return [7]; // Interior door
  } else if (roomType_lower.includes('basement')) {
    return [1, 7, 8]; // Can lights, interior doors, egress window
  } else {
    return []; // No fixtures by default
  }
};

/**
 * Calculate fixture costs for a room
 * @param roomType The type of room
 * @param options Configuration options for fixtures
 * @returns The calculated fixture costs with breakdown
 */
export const calculateFixtureCosts = (
  roomType: string,
  options: {
    canLights?: number;
    bathFans?: number;
    toilets?: number;
    vanities?: number;
    showerType?: 'tile' | 'fiberglass';
    interiorDoors?: number;
    egressWindows?: number;
  } = {}
): {
  items: { name: string; cost: number; unit: string; }[];
  total: number;
} => {
  const fixtureIds = getTypicalFixturesForRoom(roomType);
  const items: { name: string; cost: number; unit: string; }[] = [];
  let total = 0;

  // Process each fixture type
  fixtureIds.forEach(id => {
    const fixture = fixtureRates.find(f => f.id === id);
    if (!fixture) return;

    let quantity = 0;

    // Determine quantity based on fixture type and options
    switch (id) {
      case 1: // Can lights
        quantity = options.canLights || 4; // Default to 4 can lights
        break;
      case 2: // Bath fan
        quantity = options.bathFans || 1; // Default to 1 bath fan
        break;
      case 3: // Toilet
        quantity = options.toilets || 1; // Default to 1 toilet
        break;
      case 4: // Vanity/sink
        quantity = options.vanities || 1; // Default to 1 vanity
        break;
      case 5: // Tile shower
        quantity = options.showerType === 'tile' ? 1 : 0;
        break;
      case 6: // Fiberglass shower
        quantity = options.showerType === 'fiberglass' || (!options.showerType && roomType.toLowerCase().includes('bathroom')) ? 1 : 0;
        break;
      case 7: // Interior door
        quantity = options.interiorDoors || 1; // Default to 1 door
        break;
      case 8: // Egress window
        quantity = options.egressWindows || 0; // Default to 0 egress windows
        break;
    }

    if (quantity > 0) {
      const cost = fixture.max_rate * quantity; // Always use max rate
      items.push({
        name: fixture.name,
        cost,
        unit: fixture.unit
      });
      total += cost;
    }
  });

  return { items, total };
};
