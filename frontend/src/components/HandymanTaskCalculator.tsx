import React, { useState, useEffect } from 'react';
import useCostCalculation from '../hooks/useCostCalculation';
import CostPreview from './CostPreview';

const HandymanTaskCalculator: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [serviceType, setServiceType] = useState<'handyman' | 'contractor'>('handyman');

  const {
    handymanTasks,
    handymanCost,
    calculateTaskCost,
    isLoading
  } = useCostCalculation();

  // Set default task when data is loaded
  useEffect(() => {
    if (handymanTasks.length > 0 && !selectedTask) {
      setSelectedTask(handymanTasks[0].key);
    }
  }, [handymanTasks, selectedTask]);

  // Calculate cost when inputs change
  useEffect(() => {
    if (selectedTask && quantity > 0) {
      calculateTaskCost(selectedTask, quantity, serviceType);
    }
  }, [selectedTask, quantity, serviceType, calculateTaskCost]);

  // Get selected task details
  const selectedTaskDetails = handymanTasks.find(task => task.key === selectedTask);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">While You're Here Cost Calculator</h2>
      <div className="flex items-center mb-2">
        <span className="text-xs bg-primary text-white px-2 py-1 rounded-md mr-2">FAIT Home</span>
        <span className="text-sm text-gray-500">Powered by FAIT's cost database</span>
      </div>
      <p className="text-gray-600 mb-6">
        Calculate the cost of small tasks that can be done while contractors are already at your home.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="input-field"
              disabled={isLoading || handymanTasks.length === 0}
            >
              {handymanTasks.map((task) => (
                <option key={task.key} value={task.key}>
                  {task.label}
                </option>
              ))}
            </select>
            {selectedTaskDetails && (
              <p className="text-xs text-gray-500 mt-1">
                Unit: {selectedTaskDetails.unit}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
              min="1"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Provider
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="serviceType"
                  value="handyman"
                  checked={serviceType === 'handyman'}
                  onChange={() => setServiceType('handyman')}
                  disabled={isLoading}
                />
                <span className="ml-2">Handyman</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="serviceType"
                  value="contractor"
                  checked={serviceType === 'contractor'}
                  onChange={() => setServiceType('contractor')}
                  disabled={isLoading}
                />
                <span className="ml-2">Contractor</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Cost Estimate</h3>
          <CostPreview
            cost={handymanCost}
            loading={isLoading}
            type="handyman"
          />

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">About Service Providers</h4>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Handyman</dt>
                <dd className="text-gray-600">
                  General home repair professionals who can handle a variety of small tasks.
                  Usually more cost-effective for simple jobs.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Contractor</dt>
                <dd className="text-gray-600">
                  Licensed specialists who typically charge more but offer warranties and
                  specialized expertise for more complex work.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-md font-medium text-blue-800 mb-2">While You're Here Savings</h3>
        <p className="text-sm text-blue-700">
          Having these small tasks done while contractors are already at your home can save you money
          on service calls and trip charges. Bundling these tasks with your main project is a smart way
          to maximize your renovation budget.
        </p>
      </div>
    </div>
  );
};

export default HandymanTaskCalculator;
