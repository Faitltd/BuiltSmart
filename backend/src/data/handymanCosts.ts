/**
 * Handyman cost data extracted from the While-You're-Here Calculator
 * This data provides cost ranges for various small tasks that can be done by handymen or contractors
 */

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
  },
  "unclog_drain": {
    "label": "Unclogging drains",
    "unit": "per drain",
    "handyman": [100, 275],
    "contractor": [120, 330]
  },
  "toilet_replace": {
    "label": "Replacing toilets",
    "unit": "per unit",
    "handyman": [175, 275],
    "contractor": [210, 330]
  },
  "garbage_disposal": {
    "label": "Installing garbage disposals",
    "unit": "per unit",
    "handyman": [80, 200],
    "contractor": [100, 240]
  },
  "toilet_repair": {
    "label": "Repairing toilet mechanisms",
    "unit": "per unit",
    "handyman": [100, 310],
    "contractor": [120, 370]
  },
  "sink_trap": {
    "label": "Replacing sink traps (P-traps)",
    "unit": "per trap",
    "handyman": [100, 150],
    "contractor": [120, 190]
  },
  "washing_machine_hoses": {
    "label": "Installing/replacing washing machine hoses",
    "unit": "per job",
    "handyman": [50, 100],
    "contractor": [60, 130]
  },
  "light_fixture": {
    "label": "Replacing light fixtures",
    "unit": "per fixture",
    "handyman": [65, 175],
    "contractor": [80, 210]
  },
  "ceiling_fan": {
    "label": "Replacing ceiling fans",
    "unit": "per fan",
    "handyman": [200, 300],
    "contractor": [240, 360]
  }
};
