import React from 'react';
import * as costQueries from '../api/costQueries';

type RemodelingCost = costQueries.RemodelingCost;
type HandymanCost = costQueries.HandymanCost;

interface CostPreviewProps {
  cost: RemodelingCost | HandymanCost | null;
  loading: boolean;
  type: 'remodeling' | 'handyman';
}

const CostPreview: React.FC<CostPreviewProps> = ({ cost, loading, type }) => {
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (!cost) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500 text-sm">
          {type === 'remodeling'
            ? 'Select a room type, quality level, and enter dimensions to see cost estimate'
            : 'Select a task and quantity to see cost estimate'}
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
      <h3 className="text-md font-medium text-blue-800 mb-2">Estimated Cost Range</h3>
      <p className="text-xl font-bold text-blue-700 mb-3">
        {formatCurrency(cost.lowCost)} - {formatCurrency(cost.highCost)}
      </p>

      {type === 'remodeling' && (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Includes:</h4>
          <div
            className="text-sm text-blue-700"
            dangerouslySetInnerHTML={{ __html: (cost as RemodelingCost).descriptor }}
          />
        </div>
      )}

      {type === 'handyman' && (
        <div className="mt-2 text-sm text-blue-700">
          <p>Task: {(cost as HandymanCost).label}</p>
          <p>Unit: {(cost as HandymanCost).unit}</p>
        </div>
      )}

      <div className="mt-3 flex flex-col">
        <p className="text-xs text-blue-600">
          Note: This is an estimate based on typical costs. Actual prices may vary based on specific materials,
          conditions, and contractor availability.
        </p>
        <div className="flex items-center mt-2">
          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-md mr-2">FAIT Home</span>
          <span className="text-xs text-gray-500">Cost data provided by FAIT</span>
        </div>
      </div>
    </div>
  );
};

export default CostPreview;
