import React, { useState } from 'react';
import { DollarSign, PlusCircle, Trash2, Home } from 'lucide-react';

// Define types for line items
type LineItem = {
  id: number;
  roomType: string;
  roomLabel: string;
  area: number;
  quality: string;
  low: number;
  high: number;
  descriptor: string;
};

const SimpleRemodelingCalculator: React.FC = () => {
  const [roomType, setRoomType] = useState('kitchen');
  const [area, setArea] = useState(200);
  const [quality, setQuality] = useState('Good');
  const [estimate, setEstimate] = useState<{low: number, high: number} | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [itemIdCounter, setItemIdCounter] = useState(1);

  // Room cost data ($ per square foot)
  const roomCostData: any = {
    kitchen: {
      'Good': [100, 150],
      'Better': [150, 250],
      'Best': [250, 350],
      'Fully Custom': [350, 500],
      descriptor: 'Kitchen remodeling includes cabinets, countertops, appliances, flooring, lighting, and plumbing fixtures.'
    },
    bathroom: {
      'Good': [120, 170],
      'Better': [170, 270],
      'Best': [270, 370],
      'Fully Custom': [370, 520],
      descriptor: 'Bathroom remodeling includes fixtures, tile work, vanity, shower/tub, flooring, and lighting.'
    },
    living_room: {
      'Good': [50, 80],
      'Better': [80, 120],
      'Best': [120, 180],
      'Fully Custom': [180, 250],
      descriptor: 'Living room remodeling includes flooring, paint, trim, lighting, and potentially built-ins or fireplace updates.'
    },
    bedroom: {
      'Good': [40, 70],
      'Better': [70, 110],
      'Best': [110, 160],
      'Fully Custom': [160, 220],
      descriptor: 'Bedroom remodeling includes flooring, paint, trim, lighting, and closet systems.'
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate estimate
  const calculateEstimate = (e: React.FormEvent) => {
    e.preventDefault();

    const costRange = roomCostData[roomType][quality];
    const lowCost = Math.round(area * costRange[0]);
    const highCost = Math.round(area * costRange[1]);

    const newEstimate = { low: lowCost, high: highCost };
    setEstimate(newEstimate);

    // Get room label based on roomType
    const roomLabel = getRoomLabel(roomType);

    // Automatically add to line items
    const newItem: LineItem = {
      id: itemIdCounter,
      roomType: roomType,
      roomLabel: roomLabel,
      area: area,
      quality: quality,
      low: lowCost,
      high: highCost,
      descriptor: roomCostData[roomType].descriptor
    };

    setLineItems([...lineItems, newItem]);
    setItemIdCounter(itemIdCounter + 1);

    // Reset area for next calculation
    setArea(200);
  };

  // Get room label from room type
  const getRoomLabel = (type: string): string => {
    switch(type) {
      case 'kitchen': return 'Kitchen';
      case 'bathroom': return 'Bathroom';
      case 'living_room': return 'Living Room';
      case 'bedroom': return 'Bedroom';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Remove a line item
  const removeLineItem = (id: number) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  // Calculate totals for all line items
  const calculateTotals = () => {
    return lineItems.reduce(
      (totals, item) => {
        return {
          low: totals.low + item.low,
          high: totals.high + item.high
        };
      },
      { low: 0, high: 0 }
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Remodeling Cost Calculator</h1>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <form onSubmit={calculateEstimate} className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Get a Ballpark Estimate</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="room-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  id="room-type"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <option value="kitchen">Kitchen</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="living_room">Living Room</option>
                  <option value="bedroom">Bedroom</option>
                </select>
              </div>

              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                  Area (square feet)
                </label>
                <input
                  type="number"
                  id="area"
                  min="1"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={area}
                  onChange={(e) => setArea(parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Level
                </label>
                <select
                  id="quality"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Better">Better</option>
                  <option value="Best">Best</option>
                  <option value="Fully Custom">Fully Custom</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Calculate Estimate
              </button>
            </div>
          </form>
        </div>

        {/* Estimate Result */}
        {estimate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="flex justify-center my-4">
              <Home className="h-8 w-8 text-blue-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">Estimated Cost</h3>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(estimate.low)} - {formatCurrency(estimate.high)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This is an estimate based on the information provided.
              Contact us for a more detailed quote.
            </p>
          </div>
        )}

        {/* Line Items Section */}
        {lineItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Estimate (Items Added Automatically)</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area (sq ft)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.roomLabel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.area}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quality}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.low)} - {formatCurrency(item.high)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th scope="row" colSpan={3} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-900">{formatCurrency(calculateTotals().low)} - {formatCurrency(calculateTotals().high)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { SimpleRemodelingCalculator };