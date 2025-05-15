import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getProjectById, 
  getRoomsByProjectId, 
  getDesignPreferenceByProjectId,
  getLaborCostsByRoomId,
  getProductsByRoomId
} from '../utils/dataService';
import { Project, Room, DesignPreference, LaborCost, SelectedProduct } from '../utils/supabaseClient';

interface ProjectDetailsProps {
  projectId: string;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [designPreference, setDesignPreference] = useState<DesignPreference | null>(null);
  const [roomProducts, setRoomProducts] = useState<{[roomId: string]: SelectedProduct[]}>({});
  const [roomLaborCosts, setRoomLaborCosts] = useState<{[roomId: string]: LaborCost[]}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'products' | 'labor'>('overview');

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch project details
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        
        // Fetch rooms
        const roomsData = await getRoomsByProjectId(projectId);
        setRooms(roomsData);
        
        // Fetch design preferences
        const designData = await getDesignPreferenceByProjectId(projectId);
        setDesignPreference(designData);
        
        // Fetch products and labor costs for each room
        const productsMap: {[roomId: string]: SelectedProduct[]} = {};
        const laborCostsMap: {[roomId: string]: LaborCost[]} = {};
        
        for (const room of roomsData) {
          const products = await getProductsByRoomId(room.id);
          productsMap[room.id] = products;
          
          const laborCosts = await getLaborCostsByRoomId(room.id);
          laborCostsMap[room.id] = laborCosts;
        }
        
        setRoomProducts(productsMap);
        setRoomLaborCosts(laborCostsMap);
        
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, user]);

  // Calculate totals
  const calculateTotals = () => {
    let totalProducts = 0;
    let totalLabor = 0;
    
    // Calculate product costs
    Object.values(roomProducts).forEach(products => {
      products.forEach(product => {
        totalProducts += product.price * product.quantity;
      });
    });
    
    // Calculate labor costs
    Object.values(roomLaborCosts).forEach(laborCosts => {
      laborCosts.forEach(labor => {
        totalLabor += labor.total_cost;
      });
    });
    
    const subtotal = totalProducts + totalLabor;
    const tax = subtotal * 0.08; // Assuming 8% tax
    const grandTotal = subtotal + tax;
    
    return {
      products: totalProducts,
      labor: totalLabor,
      subtotal,
      tax,
      grandTotal
    };
  };

  const totals = calculateTotals();

  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <p className="text-gray-600">Please sign in to view project details.</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-4">
        {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded my-4">
        Project not found or you don't have permission to view it.
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{project.name}</h2>
        <button
          onClick={() => window.location.href = '/projects'}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
        >
          Back to Projects
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'rooms' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('rooms')}
            >
              Rooms
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'products' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'labor' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('labor')}
            >
              Labor
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Project Details</h3>
                  <p className="text-gray-700 mb-2">{project.description || 'No description provided.'}</p>
                  <p className="text-sm text-gray-600">
                    Budget: ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Last Updated: {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Design Preferences</h3>
                  {designPreference ? (
                    <>
                      <p className="text-gray-700 mb-2">Style: {designPreference.style || 'Not specified'}</p>
                      <p className="text-gray-700 mb-2">
                        Color Preferences: {
                          designPreference.color_preferences 
                            ? Array.isArray(designPreference.color_preferences) 
                              ? designPreference.color_preferences.join(', ')
                              : JSON.stringify(designPreference.color_preferences)
                            : 'None'
                        }
                      </p>
                      <p className="text-gray-700">
                        Material Preferences: {
                          designPreference.material_preferences 
                            ? Array.isArray(designPreference.material_preferences) 
                              ? designPreference.material_preferences.join(', ')
                              : JSON.stringify(designPreference.material_preferences)
                            : 'None'
                        }
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">No design preferences specified.</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Estimate Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Products Total:</p>
                    <p className="text-lg font-medium">${totals.products.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Labor Total:</p>
                    <p className="text-lg font-medium">${totals.labor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tax (8%):</p>
                    <p className="text-lg font-medium">${totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Grand Total:</p>
                    <p className="text-xl font-bold text-primary">${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'rooms' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Rooms</h3>
              {rooms.length === 0 ? (
                <p className="text-gray-600">No rooms added to this project.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map(room => (
                    <div key={room.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{room.type}</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Dimensions: {room.length && room.width 
                          ? `${room.length}' × ${room.width}'` 
                          : room.square_footage 
                            ? `${room.square_footage} sq ft` 
                            : 'Not specified'}
                      </p>
                      {room.ceiling_height && (
                        <p className="text-sm text-gray-600">
                          Ceiling Height: {room.ceiling_height}'
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'products' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Selected Products</h3>
              {Object.keys(roomProducts).length === 0 ? (
                <p className="text-gray-600">No products added to this project.</p>
              ) : (
                <div>
                  {rooms.map(room => {
                    const products = roomProducts[room.id] || [];
                    if (products.length === 0) return null;
                    
                    return (
                      <div key={room.id} className="mb-6">
                        <h4 className="font-medium mb-3">{room.type}</h4>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {products.map(product => (
                                <tr key={product.id}>
                                  <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">${product.price.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{product.quantity}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                    ${(product.price * product.quantity).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'labor' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Labor Costs</h3>
              {Object.keys(roomLaborCosts).length === 0 ? (
                <p className="text-gray-600">No labor costs added to this project.</p>
              ) : (
                <div>
                  {rooms.map(room => {
                    const laborCosts = roomLaborCosts[room.id] || [];
                    if (laborCosts.length === 0) return null;
                    
                    return (
                      <div key={room.id} className="mb-6">
                        <h4 className="font-medium mb-3">{room.type}</h4>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (per sq ft)</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {laborCosts.map(labor => (
                                <tr key={labor.id}>
                                  <td className="px-4 py-3 text-sm text-gray-900">{labor.trade_type}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">${labor.rate_per_sqft.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                    ${labor.total_cost.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
