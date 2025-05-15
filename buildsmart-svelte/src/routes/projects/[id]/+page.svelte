<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { user } from '$lib/stores/authStore';
  import { 
    getProjectById, 
    getRoomsByProjectId, 
    getDesignPreferenceByProjectId,
    getLaborCostsByRoomId,
    getProductsByRoomId
  } from '$lib/services/dataService';
  import type { 
    Project, 
    Room, 
    DesignPreference, 
    LaborCost, 
    SelectedProduct 
  } from '$lib/supabase';
  
  let project: Project | null = null;
  let rooms: Room[] = [];
  let designPreference: DesignPreference | null = null;
  let roomProducts: {[roomId: string]: SelectedProduct[]} = {};
  let roomLaborCosts: {[roomId: string]: LaborCost[]} = {};
  let loading = true;
  let error: string | null = null;
  let activeTab: 'overview' | 'rooms' | 'products' | 'labor' = 'overview';
  
  // Get project ID from URL
  const projectId = $page.params.id;
  
  onMount(async () => {
    await fetchProjectData();
  });
  
  async function fetchProjectData() {
    if (!$user) {
      loading = false;
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      // Fetch project details
      project = await getProjectById(projectId);
      
      // Fetch rooms
      rooms = await getRoomsByProjectId(projectId);
      
      // Fetch design preferences
      designPreference = await getDesignPreferenceByProjectId(projectId);
      
      // Fetch products and labor costs for each room
      const productsMap: {[roomId: string]: SelectedProduct[]} = {};
      const laborCostsMap: {[roomId: string]: LaborCost[]} = {};
      
      for (const room of rooms) {
        const products = await getProductsByRoomId(room.id);
        productsMap[room.id] = products;
        
        const laborCosts = await getLaborCostsByRoomId(room.id);
        laborCostsMap[room.id] = laborCosts;
      }
      
      roomProducts = productsMap;
      roomLaborCosts = laborCostsMap;
    } catch (err) {
      console.error('Error fetching project data:', err);
      error = 'Failed to load project data. Please try again later.';
    } finally {
      loading = false;
    }
  }
  
  // Calculate totals
  function calculateTotals() {
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
  }
  
  $: totals = calculateTotals();
  
  function openAuthModal() {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">
      {project ? project.name : 'Project Details'}
    </h1>
    <a
      href="/projects"
      class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
    >
      Back to Projects
    </a>
  </div>
  
  {#if !$user}
    <div class="text-center py-10 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">Project Details</h2>
      <p class="text-gray-600 mb-4">Please sign in to view project details.</p>
      <button
        on:click={openAuthModal}
        class="btn-primary"
      >
        Sign In
      </button>
    </div>
  {:else if loading}
    <div class="flex justify-center items-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-4">
      {error}
    </div>
  {:else if !project}
    <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded my-4">
      Project not found or you don't have permission to view it.
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="border-b">
        <div class="flex">
          <button
            class={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            on:click={() => activeTab = 'overview'}
          >
            Overview
          </button>
          <button
            class={`px-4 py-3 text-sm font-medium ${activeTab === 'rooms' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            on:click={() => activeTab = 'rooms'}
          >
            Rooms
          </button>
          <button
            class={`px-4 py-3 text-sm font-medium ${activeTab === 'products' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            on:click={() => activeTab = 'products'}
          >
            Products
          </button>
          <button
            class={`px-4 py-3 text-sm font-medium ${activeTab === 'labor' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            on:click={() => activeTab = 'labor'}
          >
            Labor
          </button>
        </div>
      </div>
      
      <div class="p-6">
        {#if activeTab === 'overview'}
          <div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 class="text-lg font-semibold mb-3">Project Details</h3>
                <p class="text-gray-700 mb-2">{project.description || 'No description provided.'}</p>
                <p class="text-sm text-gray-600">
                  Budget: ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                </p>
                <p class="text-sm text-gray-600">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
                <p class="text-sm text-gray-600">
                  Last Updated: {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-semibold mb-3">Design Preferences</h3>
                {#if designPreference}
                  <p class="text-gray-700 mb-2">Style: {designPreference.style || 'Not specified'}</p>
                  <p class="text-gray-700 mb-2">
                    Color Preferences: {
                      designPreference.color_preferences 
                        ? Array.isArray(designPreference.color_preferences) 
                          ? designPreference.color_preferences.join(', ')
                          : JSON.stringify(designPreference.color_preferences)
                        : 'None'
                    }
                  </p>
                  <p class="text-gray-700">
                    Material Preferences: {
                      designPreference.material_preferences 
                        ? Array.isArray(designPreference.material_preferences) 
                          ? designPreference.material_preferences.join(', ')
                          : JSON.stringify(designPreference.material_preferences)
                        : 'None'
                    }
                  </p>
                {:else}
                  <p class="text-gray-600">No design preferences specified.</p>
                {/if}
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-3">Estimate Summary</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-600">Products Total:</p>
                  <p class="text-lg font-medium">${totals.products.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Labor Total:</p>
                  <p class="text-lg font-medium">${totals.labor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Tax (8%):</p>
                  <p class="text-lg font-medium">${totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 font-semibold">Grand Total:</p>
                  <p class="text-xl font-bold text-primary">${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        {:else if activeTab === 'rooms'}
          <div>
            <h3 class="text-lg font-semibold mb-4">Rooms</h3>
            {#if rooms.length === 0}
              <p class="text-gray-600">No rooms added to this project.</p>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each rooms as room}
                  <div class="border rounded-lg p-4">
                    <h4 class="font-medium mb-2">{room.type}</h4>
                    <p class="text-sm text-gray-600 mb-1">
                      Dimensions: {room.length && room.width 
                        ? `${room.length}' × ${room.width}'` 
                        : room.square_footage 
                          ? `${room.square_footage} sq ft` 
                          : 'Not specified'}
                    </p>
                    {#if room.ceiling_height}
                      <p class="text-sm text-gray-600">
                        Ceiling Height: {room.ceiling_height}'
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else if activeTab === 'products'}
          <div>
            <h3 class="text-lg font-semibold mb-4">Selected Products</h3>
            {#if Object.keys(roomProducts).length === 0}
              <p class="text-gray-600">No products added to this project.</p>
            {:else}
              {#each rooms as room}
                {@const products = roomProducts[room.id] || []}
                {#if products.length > 0}
                  <div class="mb-6">
                    <h4 class="font-medium mb-3">{room.type}</h4>
                    <div class="bg-gray-50 rounded-lg overflow-hidden">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100">
                          <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          {#each products as product}
                            <tr>
                              <td class="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                              <td class="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                              <td class="px-4 py-3 text-sm text-gray-900 text-right">${product.price.toFixed(2)}</td>
                              <td class="px-4 py-3 text-sm text-gray-900 text-right">{product.quantity}</td>
                              <td class="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                ${(product.price * product.quantity).toFixed(2)}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          </div>
        {:else if activeTab === 'labor'}
          <div>
            <h3 class="text-lg font-semibold mb-4">Labor Costs</h3>
            {#if Object.keys(roomLaborCosts).length === 0}
              <p class="text-gray-600">No labor costs added to this project.</p>
            {:else}
              {#each rooms as room}
                {@const laborCosts = roomLaborCosts[room.id] || []}
                {#if laborCosts.length > 0}
                  <div class="mb-6">
                    <h4 class="font-medium mb-3">{room.type}</h4>
                    <div class="bg-gray-50 rounded-lg overflow-hidden">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100">
                          <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (per sq ft)</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          {#each laborCosts as labor}
                            <tr>
                              <td class="px-4 py-3 text-sm text-gray-900">{labor.trade_type}</td>
                              <td class="px-4 py-3 text-sm text-gray-900 text-right">${labor.rate_per_sqft.toFixed(2)}</td>
                              <td class="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                ${labor.total_cost.toFixed(2)}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
