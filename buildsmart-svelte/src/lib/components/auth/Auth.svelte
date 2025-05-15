<script lang="ts">
  import { signIn, signUp } from '$lib/stores/authStore';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let view: 'sign-in' | 'sign-up' = 'sign-in';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let error: string | null = null;
  
  async function handleSignIn() {
    if (!email || !password) return;
    
    try {
      loading = true;
      error = null;
      
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        error = signInError.message;
        return;
      }
      
      dispatch('authSuccess');
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error('Sign in error:', err);
    } finally {
      loading = false;
    }
  }
  
  async function handleSignUp() {
    if (!email || !password) return;
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    if (password.length < 8) {
      error = 'Password must be at least 8 characters long';
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      const { error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        error = signUpError.message;
        return;
      }
      
      // Show success message and switch to sign-in view
      alert('Check your email for the confirmation link!');
      view = 'sign-in';
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error('Sign up error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-primary">BuildSmart by FAIT</h2>
    <p class="text-gray-600 mt-1">Your remodeling estimate assistant</p>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  {#if view === 'sign-in'}
    <div>
      <h3 class="text-xl font-semibold mb-4">Sign In</h3>
      <form on:submit|preventDefault={handleSignIn}>
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            class="input-field"
            required
          />
        </div>
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            class="input-field"
            required
          />
        </div>
        <button
          type="submit"
          class="btn-primary w-full"
          disabled={loading}
        >
          {#if loading}
            <span class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </span>
          {:else}
            Sign In
          {/if}
        </button>
      </form>
      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            on:click={() => view = 'sign-up'}
            class="text-primary hover:underline focus:outline-none"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  {:else}
    <div>
      <h3 class="text-xl font-semibold mb-4">Create an Account</h3>
      <form on:submit|preventDefault={handleSignUp}>
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            class="input-field"
            required
          />
        </div>
        <div class="mb-4">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            class="input-field"
            required
          />
          <p class="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters long
          </p>
        </div>
        <div class="mb-6">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            class="input-field"
            required
          />
        </div>
        <button
          type="submit"
          class="btn-primary w-full"
          disabled={loading}
        >
          {#if loading}
            <span class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          {:else}
            Sign Up
          {/if}
        </button>
      </form>
      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            on:click={() => view = 'sign-in'}
            class="text-primary hover:underline focus:outline-none"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  {/if}
</div>
