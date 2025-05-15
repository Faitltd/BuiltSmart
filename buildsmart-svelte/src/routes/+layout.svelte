<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initAuth, user } from '$lib/stores/authStore';
  import Auth from '$lib/components/auth/Auth.svelte';

  let showAuth = false;

  onMount(() => {
    // Initialize auth
    initAuth();

    // Listen for custom event to open auth modal
    const handleOpenAuthModal = () => {
      showAuth = true;
    };

    window.addEventListener('open-auth-modal', handleOpenAuthModal);

    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuthModal);
    };
  });

  function handleAuthSuccess() {
    showAuth = false;
  }
</script>

<div class="min-h-screen bg-gray-50">
  {#if showAuth}
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="text-lg font-semibold">Sign In or Create Account</h2>
          <button
            on:click={() => showAuth = false}
            class="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <Auth on:authSuccess={handleAuthSuccess} />
        </div>
      </div>
    </div>
  {/if}

  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="text-2xl font-bold text-primary">BuildSmart</h1>
        <span class="text-sm text-gray-500 ml-2">by FAIT</span>
      </div>

      <nav class="flex space-x-4">
        <a href="/" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Home</a>
        <a href="/projects" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Projects</a>

        {#if $user}
          <button
            on:click={() => showAuth = true}
            class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
          >
            Account
          </button>
        {:else}
          <button
            on:click={() => showAuth = true}
            class="btn-primary"
          >
            Sign In
          </button>
        {/if}
      </nav>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <slot />
  </main>

  <footer class="bg-white border-t mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <p class="text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} BuildSmart by FAIT. All rights reserved.
      </p>
    </div>
  </footer>
</div>
