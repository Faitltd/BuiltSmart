import pool from '../database/postgres/connection';
import { Estimate } from '../database/mongodb/schemas';
import mongoose from 'mongoose';
import { calculateRemodelingCost, calculateHandymanCost } from './costCalculationService';

// Calculate labor cost based on room dimensions and trade
export const calculateLaborCost = async (
  trade_id: number,
  dimensions: { length: number; width: number; height?: number; area: number },
  region: string = 'National Average'
): Promise<{ rate: number; total: number; unit: string }> => {
  try {
    // Get labor rate for the trade
    const rateResult = await pool.query(
      'SELECT * FROM labor_rates WHERE trade_id = $1 AND region = $2',
      [trade_id, region]
    );

    if (rateResult.rows.length === 0) {
      throw new Error(`No labor rate found for trade ${trade_id} in region ${region}`);
    }

    const laborRate = rateResult.rows[0];
    let total = 0;

    // Calculate total based on unit type
    switch (laborRate.unit) {
      case 'sq_ft':
        total = laborRate.rate * dimensions.area;
        break;
      case 'linear_ft':
        total = laborRate.rate * (dimensions.length * 2 + dimensions.width * 2);
        break;
      case 'fixture':
      case 'outlet':
      case 'unit':
        // For these units, we need a quantity which should be provided separately
        // Default to 1 for now
        total = laborRate.rate * 1;
        break;
      default:
        total = laborRate.rate;
    }

    return {
      rate: laborRate.rate,
      total: parseFloat(total.toFixed(2)),
      unit: laborRate.unit
    };
  } catch (error) {
    console.error('Error calculating labor cost:', error);
    throw error;
  }
};

// Update estimate totals
export const updateEstimateTotals = async (estimate_id: string): Promise<void> => {
  try {
    const estimate = await Estimate.findById(estimate_id);

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    let laborTotal = 0;
    let productsTotal = 0;

    // Calculate totals from all rooms
    estimate.rooms.forEach(room => {
      // Sum labor items
      room.labor_items.forEach(item => {
        laborTotal += item.total;
      });

      // Sum product items
      room.product_items.forEach(item => {
        productsTotal += item.total;
      });
    });

    // Calculate tax (assuming 8% tax rate on products)
    const taxRate = 0.08;
    const taxTotal = productsTotal * taxRate;

    // Calculate grand total
    const grandTotal = laborTotal + productsTotal + taxTotal;

    // Update the estimate with new totals
    await Estimate.findByIdAndUpdate(estimate_id, {
      'totals.labor': parseFloat(laborTotal.toFixed(2)),
      'totals.products': parseFloat(productsTotal.toFixed(2)),
      'totals.tax': parseFloat(taxTotal.toFixed(2)),
      'totals.grand_total': parseFloat(grandTotal.toFixed(2)),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error updating estimate totals:', error);
    throw error;
  }
};

// Add labor item to a room
export const addLaborItem = async (
  estimate_id: string,
  room_id: string,
  labor_item: {
    trade_id: number;
    description: string;
    quantity: number;
    unit: string;
  }
): Promise<any> => {
  try {
    const estimate = await Estimate.findById(estimate_id);

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Find room by ID (using any type to bypass TypeScript checking)
    const room = estimate.rooms.find((r: any) => r._id && r._id.toString() === room_id);

    if (!room) {
      throw new Error('Room not found in estimate');
    }

    // Get trade name
    const tradeResult = await pool.query('SELECT name FROM trades WHERE id = $1', [labor_item.trade_id]);

    if (tradeResult.rows.length === 0) {
      throw new Error(`Trade with ID ${labor_item.trade_id} not found`);
    }

    const tradeName = tradeResult.rows[0].name;

    // Calculate labor cost
    const { rate, total } = await calculateLaborCost(
      labor_item.trade_id,
      room.dimensions,
      'National Average'
    );

    // Create new labor item
    const newLaborItem = {
      _id: new mongoose.Types.ObjectId(),
      trade_id: labor_item.trade_id,
      description: labor_item.description,
      quantity: labor_item.quantity,
      unit: labor_item.unit,
      rate,
      total: parseFloat((rate * labor_item.quantity).toFixed(2))
    };

    // Add to room's labor items
    await Estimate.updateOne(
      { _id: estimate_id, 'rooms._id': room_id },
      {
        $push: { 'rooms.$.labor_items': newLaborItem },
        updated_at: new Date()
      }
    );

    // Update estimate totals
    await updateEstimateTotals(estimate_id);

    return {
      ...newLaborItem,
      trade_name: tradeName
    };
  } catch (error) {
    console.error('Error adding labor item:', error);
    throw error;
  }
};

// Calculate remodeling cost for a room
export const calculateRemodelingCostForRoom = (
  roomType: string,
  qualityLevel: string,
  dimensions: { length: number; width: number; height?: number; area: number }
): { lowCost: number; highCost: number; descriptor: string } => {
  // Calculate area if not provided
  const area = dimensions.area || (dimensions.length * dimensions.width);

  // Use the cost calculation service
  return calculateRemodelingCost(roomType, qualityLevel, area);
};

// Calculate handyman task cost
export const calculateHandymanTaskCost = (
  taskKey: string,
  quantity: number,
  serviceType: 'handyman' | 'contractor' = 'handyman'
): { lowCost: number; highCost: number; unit: string; label: string } => {
  // Use the cost calculation service
  return calculateHandymanCost(taskKey, quantity, serviceType);
};