// ============================================
// BUILDSMART SUPABASE CONFIGURATION
// Production-Ready Version
// ============================================

const SUPABASE_URL = 'https://ydisdyadjupyswcpbxzu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_anFerPxSwP91IRUqDmyDw_c9q3esOi';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTHENTICATION HELPERS
// ============================================
const supabaseAuth = {
  currentUser: null,
  authListeners: [],

  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (error) throw error;
      this.currentUser = data.user;
      console.log('✅ Sign up successful');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      this.currentUser = data.user;
      console.log('✅ Sign in successful');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      this.currentUser = null;
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('❌ Get user error:', error);
      return null;
    }
  },

  onAuthStateChange(callback) {
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state:', event);
      this.currentUser = session?.user || null;
      callback(event, session);
    });
    return data.subscription;
  }
};

// ============================================
// DATABASE HELPERS
// ============================================
const supabaseDB = {
  async saveProject(projectData) {
    try {
      const user = await supabaseAuth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('buildsmart_projects')
        .insert({
          user_id: user.id,
          project_name: projectData.name,
          total_cost: projectData.totalCost || 0,
          status: projectData.status || 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Project saved:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Save project error:', error);
      return { success: false, error: error.message };
    }
  },

  async saveRoom(projectId, roomData) {
    try {
      const { data, error } = await supabaseClient
        .from('buildsmart_rooms')
        .insert({
          project_id: projectId,
          room_name: roomData.name,
          room_type: roomData.type,
          dimensions: {
            length: parseFloat(roomData.length) || 0,
            width: parseFloat(roomData.width) || 0,
            height: parseFloat(roomData.height) || 0
          }
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Room saved:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Save room error:', error);
      return { success: false, error: error.message };
    }
  },

  async saveEstimate(projectId, roomId, estimateData) {
    try {
      const { data, error } = await supabaseClient
        .from('buildsmart_estimates')
        .insert({
          project_id: projectId,
          room_id: roomId,
          category: estimateData.category,
          item_name: estimateData.itemName,
          quantity: parseFloat(estimateData.quantity) || 0,
          unit_cost: parseFloat(estimateData.unitCost) || 0,
          total_cost: parseFloat(estimateData.totalCost) || 0,
          notes: estimateData.notes || ''
        })
        .select();

      if (error) throw error;
      console.log('✅ Estimates saved:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Save estimate error:', error);
      return { success: false, error: error.message };
    }
  },

  async saveConversation(projectId, messageType, content) {
    try {
      const user = await supabaseAuth.getCurrentUser();
      if (!user) return { success: false };

      const { data, error } = await supabaseClient
        .from('buildsmart_conversations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message_type: messageType,
          message_content: content
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Save conversation error:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserProjects() {
    try {
      const user = await supabaseAuth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('buildsmart_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Get projects error:', error);
      return { success: false, error: error.message };
    }
  }
};

console.log('🚀 Supabase configured for BuildSmart');
