<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  import { getProjects, deleteProject } from '$lib/services/dataService';
  import type { Project } from '$lib/supabase';
  
  let projects: Project[] = [];
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    await fetchProjects();
  });
  
  async function fetchProjects() {
    if (!$user) {
      projects = [];
      loading = false;
      return;
    }
    
    try {
      loading = true;
      error = null;
      projects = await getProjects($user.id);
    } catch (err) {
      console.error('Error fetching projects:', err);
      error = 'Failed to load projects. Please try again later.';
    } finally {
      loading = false;
    }
  }
  
  async function handleDeleteProject(projectId: string) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteProject(projectId);
      projects = projects.filter(project => project.id !== projectId);
    } catch (err) {
      console.error('Error deleting project:', err);
      error = 'Failed to delete project. Please try again later.';
    }
  }
  
  function openAuthModal() {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  }
</script>

<div>
  <h1 class="text-2xl font-bold mb-6">My Projects</h1>
  
  {#if !$user}
    <div class="text-center py-10 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">My Projects</h2>
      <p class="text-gray-600 mb-4">Please sign in to view your projects.</p>
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
  {:else if projects.length === 0}
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
      <p class="text-gray-600 mb-4">You don't have any saved projects yet.</p>
      <a
        href="/"
        class="btn-primary inline-block"
      >
        Create New Project
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each projects as project}
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-4 border-b">
            <h3 class="text-lg font-semibold">{project.name}</h3>
            <p class="text-sm text-gray-500">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div class="p-4">
            <p class="text-gray-700 mb-3">
              {project.description || 'No description provided.'}
            </p>
            <p class="text-sm text-gray-600 mb-4">
              Budget: ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
            </p>
            <div class="flex space-x-2">
              <a
                href={`/projects/${project.id}`}
                class="flex-1 px-3 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors text-sm text-center"
              >
                View Project
              </a>
              <button
                on:click={() => handleDeleteProject(project.id)}
                class="px-3 py-2 bg-white border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
