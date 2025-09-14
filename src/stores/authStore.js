import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, auth, profiles } from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      profile: null,
      session: null,
      loading: true,
      error: null,

      // Actions
      setUser: (user) => set({ user, error: null }),
      setProfile: (profile) => set({ profile }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Initialize auth state
      initialize: async () => {
        try {
          set({ loading: true, error: null });
          
          // Get current session
          const { session, error: sessionError } = await auth.getSession();
          
          if (sessionError) throw sessionError;
          
          if (session) {
            set({ session, user: session.user });
            
            // Fetch user profile
            const { data: profile, error: profileError } = await profiles.get(session.user.id);
            if (!profileError && profile) {
              set({ profile });
            }
          }
          
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('Auth event:', event);
              
              if (event === 'SIGNED_IN' && session) {
                set({ session, user: session.user });
                
                // Fetch/create user profile
                const { data: profile } = await profiles.get(session.user.id);
                if (profile) {
                  set({ profile });
                }
              } else if (event === 'SIGNED_OUT') {
                set({ session: null, user: null, profile: null });
              } else if (event === 'USER_UPDATED' && session) {
                set({ session, user: session.user });
                
                // Refresh profile
                const { data: profile } = await profiles.get(session.user.id);
                if (profile) {
                  set({ profile });
                }
              } else if (event === 'TOKEN_REFRESHED' && session) {
                set({ session });
              }
            }
          );
          
          // Store subscription for cleanup
          set({ authSubscription: subscription });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },

      // Sign up
      signUp: async ({ email, password, fullName, role = 'traveler' }) => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await auth.signUp({
            email,
            password,
            data: {
              full_name: fullName,
              role,
            },
          });
          
          if (error) throw error;
          
          return { success: true, data };
        } catch (error) {
          console.error('Sign up error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Sign in
      signIn: async ({ email, password }) => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await auth.signIn({ email, password });
          
          if (error) throw error;
          
          if (data.session) {
            set({ session: data.session, user: data.user });
            
            // Fetch user profile
            const { data: profile } = await profiles.get(data.user.id);
            if (profile) {
              set({ profile });
            }
          }
          
          return { success: true, data };
        } catch (error) {
          console.error('Sign in error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Sign in with OAuth provider
      signInWithProvider: async (provider) => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await auth.signInWithProvider(provider);
          
          if (error) throw error;
          
          return { success: true, data };
        } catch (error) {
          console.error('OAuth sign in error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ loading: true, error: null });
          
          const { error } = await auth.signOut();
          
          if (error) throw error;
          
          set({ session: null, user: null, profile: null });
          
          return { success: true };
        } catch (error) {
          console.error('Sign out error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Reset password
      resetPassword: async (email) => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await auth.resetPassword(email);
          
          if (error) throw error;
          
          return { success: true, data };
        } catch (error) {
          console.error('Reset password error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Update password
      updatePassword: async (newPassword) => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await auth.updatePassword(newPassword);
          
          if (error) throw error;
          
          return { success: true, data };
        } catch (error) {
          console.error('Update password error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Update profile
      updateProfile: async (updates) => {
        try {
          set({ loading: true, error: null });
          
          const user = get().user;
          if (!user) throw new Error('No user logged in');
          
          const { data, error } = await profiles.update(user.id, updates);
          
          if (error) throw error;
          
          set({ profile: data });
          
          return { success: true, data };
        } catch (error) {
          console.error('Update profile error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Upload avatar
      uploadAvatar: async (file) => {
        try {
          set({ loading: true, error: null });
          
          const user = get().user;
          if (!user) throw new Error('No user logged in');
          
          const { data, error } = await profiles.uploadAvatar(user.id, file);
          
          if (error) throw error;
          
          // Update profile with new avatar URL
          const profile = get().profile;
          set({ profile: { ...profile, avatar_url: data } });
          
          return { success: true, data };
        } catch (error) {
          console.error('Upload avatar error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Verify email OTP
      verifyOTP: async ({ email, token }) => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await auth.verifyOTP({ email, token });
          
          if (error) throw error;
          
          if (data.session) {
            set({ session: data.session, user: data.user });
          }
          
          return { success: true, data };
        } catch (error) {
          console.error('Verify OTP error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Resend confirmation email
      resendConfirmation: async (email) => {
        try {
          set({ loading: true, error: null });
          
          const { data, error } = await auth.resendConfirmation(email);
          
          if (error) throw error;
          
          return { success: true, data };
        } catch (error) {
          console.error('Resend confirmation error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },

      // Cleanup
      cleanup: () => {
        const subscription = get().authSubscription;
        if (subscription) {
          subscription.unsubscribe();
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
      }),
    }
  )
);

export default useAuthStore;