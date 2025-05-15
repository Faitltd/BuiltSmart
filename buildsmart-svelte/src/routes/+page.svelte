<script lang="ts">
  import Chat from '$lib/components/chat/Chat.svelte';
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div class="lg:col-span-8">
    <div class="bg-white rounded-lg shadow-md overflow-hidden h-[600px]">
      <Chat />
    </div>
  </div>

  <div class="lg:col-span-4">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4">About BuildSmart</h2>
      <p class="text-gray-700 mb-4">
        BuildSmart by FAIT is an interactive estimate builder system that helps you plan your remodeling projects with accurate cost estimates.
      </p>
      <p class="text-gray-700 mb-4">
        Simply chat with our AI assistant about your project, and we'll generate a detailed estimate including materials, labor, and total costs.
      </p>
      <h3 class="text-lg font-semibold mt-6 mb-2">Features</h3>
      <ul class="list-disc list-inside text-gray-700 space-y-2">
        <li>Interactive chat interface</li>
        <li>Accurate cost estimates</li>
        <li>Product recommendations</li>
        <li>Save and share your estimates</li>
        <li>Track multiple projects</li>
      </ul>
    </div>
  </div>
</div>
