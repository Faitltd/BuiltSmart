<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import {
    chatHistory,
    isLoading,
    chatbotState,
    showSaveButton,
    isSaving,
    saveSuccess,
    initializeChatbot,
    addMessage
  } from '$lib/stores/chatStore';
  import { user } from '$lib/stores/authStore';
  import { generateChatbotResponse, saveProjectToSupabase } from '$lib/services/chatbotService';
  import type { Message } from '$lib/stores/chatStore';

  let message = '';
  let messagesEnd: HTMLDivElement;
  let useNewChatbot = true;

  // Initialize chatbot on component mount
  onMount(() => {
    const { response, state } = initializeChatbot();
    $chatbotState = state;

    // Add initial greeting to chat history
    $chatHistory = [
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }
    ];
  });

  // Scroll to bottom when messages change
  afterUpdate(() => {
    if (messagesEnd) {
      messagesEnd.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Toggle between old and new chatbot
  function toggleChatbot() {
    useNewChatbot = !useNewChatbot;

    // Clear chat history and initialize new chatbot if switching to new chatbot
    if (useNewChatbot) {
      const { response, state } = initializeChatbot();
      $chatbotState = state;

      $chatHistory = [
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        }
      ];
    }
  }

  // Handle sending a message
  function handleSendMessage() {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    $chatHistory = [...$chatHistory, userMessage];
    message = '';
    $isLoading = true;

    // Simulate AI response delay
    setTimeout(() => {
      let responseContent = '';

      if (useNewChatbot && $chatbotState) {
        // Use the new chatbot handler
        const { response, updatedState } = generateChatbotResponse($chatbotState, userMessage.content);
        responseContent = response;
        $chatbotState = updatedState;
      } else {
        // Use a simple response
        responseContent = "I'm sorry, the old chatbot is not available in this version.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString()
      };

      $chatHistory = [...$chatHistory, assistantMessage];
      $isLoading = false;
    }, 1000);
  }

  // Handle saving project to Supabase
  async function handleSaveProject() {
    if (!$user || !$chatbotState) return;

    try {
      $isSaving = true;
      const projectId = await saveProjectToSupabase($chatbotState, $user.id);

      if (projectId) {
        $saveSuccess = true;
        $showSaveButton = false;

        // Add success message to chat
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Your project has been saved successfully! You can access it anytime from your projects dashboard.`,
          timestamp: new Date().toISOString()
        };

        $chatHistory = [...$chatHistory, successMessage];
      }
    } catch (error) {
      console.error('Error saving project:', error);

      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, there was an error saving your project. Please try again later.`,
        timestamp: new Date().toISOString()
      };

      $chatHistory = [...$chatHistory, errorMessage];
    } finally {
      $isSaving = false;
    }
  }

  // Open auth modal
  function openAuthModal() {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  }
</script>

<div class="flex flex-col h-full">
  <div class="flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
    <h2 class="text-lg font-bold text-primary">BuildSmart by FAIT</h2>
    <div class="flex items-center space-x-2">
      <button
        on:click={toggleChatbot}
        class="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
      >
        {useNewChatbot ? 'Switch to Labor Cost Bot' : 'Switch to Remodeling Estimate Bot'}
      </button>
      {#if $user}
        <span class="text-sm text-gray-600">
          Signed in as <span class="font-medium">{$user.email}</span>
        </span>
      {/if}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    {#each $chatHistory as message}
      <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-3/4 p-3 rounded-lg {message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}">
          <div class="whitespace-pre-wrap">{message.content}</div>
          <div class="text-xs text-gray-500 mt-1 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    {/each}

    {#if $isLoading}
      <div class="flex justify-start">
        <div class="max-w-3/4 p-3 rounded-lg bg-gray-100">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    {/if}

    <div bind:this={messagesEnd}></div>
  </div>

  <div class="border-t p-4">
    <div class="flex flex-col space-y-3">
      {#if $showSaveButton && $user}
        <div class="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div>
            <p class="text-sm font-medium text-blue-800">Ready to save your project?</p>
            <p class="text-xs text-blue-600">Save your estimate to access it later or share with contractors.</p>
          </div>
          <button
            on:click={handleSaveProject}
            disabled={$isSaving}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {#if $isSaving}
              <span class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            {:else}
              Save Project
            {/if}
          </button>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSendMessage} class="flex items-center">
        <input
          type="text"
          bind:value={message}
          placeholder="Type your message..."
          class="input-field flex-1"
          disabled={$isLoading}
        />
        <button
          type="submit"
          class="btn-primary ml-2"
          disabled={$isLoading || !message.trim()}
        >
          {#if $isLoading}
            <span class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          {:else}
            Send
          {/if}
        </button>
      </form>

      {#if !$user && useNewChatbot}
        <div class="text-center text-sm text-gray-500 mt-2">
          <button
            on:click={openAuthModal}
            class="text-primary"
          >
            Sign in
          </button> to save your estimate and access it later
        </div>
      {/if}
    </div>
  </div>
</div>
