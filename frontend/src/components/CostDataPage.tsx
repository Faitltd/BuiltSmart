import React, { useState } from 'react';
import HandymanTaskCalculator from './HandymanTaskCalculator';
import useCostCalculation from '../hooks/useCostCalculation';

const CostDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roomCosts' | 'handymanCosts'>('roomCosts');
  const { roomTypes, handymanTasks, isLoading } = useCostCalculation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cost Data Reference</h1>
        <p className="mt-2 text-gray-600">
          Reference pricing for remodeling projects and handyman tasks from <span className="font-medium text-primary">FAIT Home</span>
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === 'roomCosts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('roomCosts')}
            >
              Room Remodeling Costs
            </button>
            <button
              className={`${
                activeTab === 'handymanCosts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('handymanCosts')}
            >
              Handyman Task Costs
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'roomCosts' && (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Room Remodeling Cost Reference</h2>
            <p className="text-gray-600 mb-6">
              These are the base costs per square foot used in our estimate calculations.
              Actual costs may vary based on specific materials, conditions, and contractor availability.
            </p>

            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Good
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Better
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Best
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fully Custom
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roomTypes.map((roomType) => (
                      <tr key={roomType.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {roomType.name}
                        </td>
                        {roomType.qualityLevels.map((level) => (
                          <td key={level} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {level === 'Good' && '$50-$100 /sq ft'}
                            {level === 'Better' && '$150-$200 /sq ft'}
                            {level === 'Best' && '$250-$300 /sq ft'}
                            {level === 'Fully Custom' && '$500+ /sq ft'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-2">About Quality Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Good</h4>
                <p className="text-sm text-blue-600 mb-4">
                  Standard quality materials and practical design elements. Suitable for rental properties
                  or budget-conscious renovations.
                </p>

                <h4 className="font-medium text-blue-700 mb-1">Better</h4>
                <p className="text-sm text-blue-600">
                  Premium quality materials with enhanced design elements. Ideal for primary residences
                  with a focus on durability and style.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Best</h4>
                <p className="text-sm text-blue-600 mb-4">
                  High-end materials with custom design elements. Perfect for homeowners seeking
                  luxury finishes and unique features.
                </p>

                <h4 className="font-medium text-blue-700 mb-1">Fully Custom</h4>
                <p className="text-sm text-blue-600">
                  Completely bespoke design with rare and exclusive materials. For those wanting
                  one-of-a-kind spaces with no compromises.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'handymanCosts' && (
        <div>
          <HandymanTaskCalculator />

          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Handyman Task Cost Reference</h2>
            <p className="text-gray-600 mb-6">
              These are the base costs for common handyman tasks used in our estimate calculations.
            </p>

            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Handyman Cost
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contractor Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {handymanTasks.map((task) => (
                      <tr key={task.key}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {task.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.key === 'drywall_repair' && '$200-$800'}
                          {task.key === 'touch_up_painting' && '$50-$150'}
                          {task.key === 'door_repair' && '$50-$100'}
                          {task.key === 'squeaky_fix' && '$50-$100'}
                          {task.key === 'caulking' && '$175-$300'}
                          {task.key === 'weather_stripping' && '$100-$400'}
                          {task.key === 'door_knobs' && '$75-$200'}
                          {task.key === 'cabinet_hardware' && '$20-$50'}
                          {task.key === 'window_screens' && '$15-$50'}
                          {task.key === 'tv_mounting' && '$100-$300'}
                          {task.key === 'leaky_faucet' && '$65-$150'}
                          {task.key === 'showerhead' && '$75-$150'}
                          {task.key === 'unclog_drain' && '$100-$275'}
                          {task.key === 'toilet_replace' && '$175-$275'}
                          {task.key === 'garbage_disposal' && '$80-$200'}
                          {task.key === 'toilet_repair' && '$100-$310'}
                          {task.key === 'sink_trap' && '$100-$150'}
                          {task.key === 'washing_machine_hoses' && '$50-$100'}
                          {task.key === 'light_fixture' && '$65-$175'}
                          {task.key === 'ceiling_fan' && '$200-$300'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.key === 'drywall_repair' && '$240-$900'}
                          {task.key === 'touch_up_painting' && '$60-$180'}
                          {task.key === 'door_repair' && '$60-$120'}
                          {task.key === 'squeaky_fix' && '$60-$120'}
                          {task.key === 'caulking' && '$210-$360'}
                          {task.key === 'weather_stripping' && '$120-$480'}
                          {task.key === 'door_knobs' && '$90-$240'}
                          {task.key === 'cabinet_hardware' && '$30-$60'}
                          {task.key === 'window_screens' && '$25-$70'}
                          {task.key === 'tv_mounting' && '$120-$360'}
                          {task.key === 'leaky_faucet' && '$80-$190'}
                          {task.key === 'showerhead' && '$90-$190'}
                          {task.key === 'unclog_drain' && '$120-$330'}
                          {task.key === 'toilet_replace' && '$210-$330'}
                          {task.key === 'garbage_disposal' && '$100-$240'}
                          {task.key === 'toilet_repair' && '$120-$370'}
                          {task.key === 'sink_trap' && '$120-$190'}
                          {task.key === 'washing_machine_hoses' && '$60-$130'}
                          {task.key === 'light_fixture' && '$80-$210'}
                          {task.key === 'ceiling_fan' && '$240-$360'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CostDataPage;
