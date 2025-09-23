import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, auth, profiles } from '../lib/supabase';
import { getErrorMessage, mapSupabaseError, isRetryableError, ERROR_CODES } from '../utils/error-mapping';
import { logRegistration, logAgeVerification, logEncryptionEvent } from '../services/compliance-logging-service';
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
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      // Sign up
      signUp: async ({ email, password, fullName, dateOfBirth, role = 'traveler' }) => {
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
        const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';

        try {
          set({ loading: true, error: null });

          let encryptedBirthDate = null;
          let ageVerificationResult = null;

          // Server-side age verification and encryption before account creation
          if (dateOfBirth) {
            const { comprehensiveAgeVerification } = await import('../services/age-verification-service');
            ageVerificationResult = await comprehensiveAgeVerification(dateOfBirth, 13);

            // Log age verification attempt
            await logAgeVerification({
              result: ageVerificationResult.success ? 'success' : 'failure',
              calculatedAge: ageVerificationResult.age,
              errorCode: ageVerificationResult.error,
              userAgent,
              origin,
              wasEncrypted: false // Initial verification uses plain text
            });

            if (!ageVerificationResult.success) {
              const errorMessage = getErrorMessage(ageVerificationResult.error, ageVerificationResult.message);
              set({ error: errorMessage });

              // Log failed registration attempt
              await logRegistration({
                result: 'failure',
                email,
                errorCode: ageVerificationResult.error,
                role,
                ageVerificationPassed: false,
                userAgent,
                origin
              });

              return {
                success: false,
                error: errorMessage,
                code: ageVerificationResult.error
              };
            }

            // Encrypt birth date after successful verification
            try {
              const { encryptBirthDate } = await import('../services/encryption-service');
              encryptedBirthDate = await encryptBirthDate(dateOfBirth, email);
            } catch (encryptionError) {
              console.error('Birth date encryption failed:', encryptionError);

              // Log encryption failure
              await logEncryptionEvent('encryption', encryptionError.message, {
                step: 'registration'
              });

              const errorMessage = getErrorMessage(ERROR_CODES.SERVER_ERROR);
              set({ error: errorMessage });

              // Log failed registration attempt
              await logRegistration({
                result: 'failure',
                email,
                errorCode: ERROR_CODES.SERVER_ERROR,
                role,
                ageVerificationPassed: true,
                userAgent,
                origin
              });

              return { success: false, error: errorMessage, code: ERROR_CODES.SERVER_ERROR };
            }
          }

          // Attempt account creation
          const { data, error } = await auth.signUp({
            email,
            password,
            data: {
              full_name: fullName,
              role,
              encrypted_birth_date: encryptedBirthDate,
            },
          });

          if (error) {
            const mappedError = mapSupabaseError(error);
            set({ error: mappedError.message });

            // Log failed registration attempt
            await logRegistration({
              result: 'failure',
              email,
              errorCode: mappedError.code,
              role,
              ageVerificationPassed: ageVerificationResult?.success || false,
              userAgent,
              origin
            });

            return { success: false, error: mappedError.message, code: mappedError.code };
          }

          // Log successful registration
          await logRegistration({
            result: 'success',
            email,
            role,
            ageVerificationPassed: ageVerificationResult?.success || false,
            userAgent,
            origin
          });

          return { success: true, data };
        } catch (error) {
          console.error('Registration error:', error);

          const errorMessage = getErrorMessage(error, 'Registration failed. Please try again.');
          set({ error: errorMessage });

          // Log failed registration attempt
          await logRegistration({
            result: 'failure',
            email,
            errorCode: error.code || ERROR_CODES.UNKNOWN_ERROR,
            role,
            ageVerificationPassed: false,
            userAgent,
            origin
          });

          return {
            success: false,
            error: errorMessage,
            code: error.code || ERROR_CODES.UNKNOWN_ERROR
          };
        } finally {
          set({ loading: false });
        }
      },
      // Sign in
      signIn: async ({ email, password }) => {
        try {
          set({ loading: true, error: null });
          const { data, error } = await auth.signIn({ email, password });

          if (error) {
            const mappedError = mapSupabaseError(error);
            set({ error: mappedError.message });
            return { success: false, error: mappedError.message, code: mappedError.code };
          }

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
          const errorMessage = getErrorMessage(error, 'Sign in failed. Please try again.');
          set({ error: errorMessage });
          return { success: false, error: errorMessage, code: error.code || ERROR_CODES.UNKNOWN_ERROR };
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

          // Handle birth date encryption if provided
          if (updates.dateOfBirth) {
            // Verify age before encryption
            const { comprehensiveAgeVerification } = await import('../services/age-verification-service');
            const ageVerification = await comprehensiveAgeVerification(updates.dateOfBirth, 13);

            if (!ageVerification.success) {
              const error = new Error(ageVerification.message || 'Age verification failed');
              error.code = ageVerification.error;
              throw error;
            }

            // Encrypt the birth date
            try {
              const { encryptBirthDate } = await import('../services/encryption-service');
              const encryptedBirthDate = await encryptBirthDate(updates.dateOfBirth, user.email);

              // Replace dateOfBirth with encrypted version and remove plain text
              updates = {
                ...updates,
                encrypted_birth_date: encryptedBirthDate,
                date_of_birth: null, // Clear any existing plain text date
              };
              delete updates.dateOfBirth; // Remove the client-side field
            } catch (encryptionError) {
              console.error('Birth date encryption failed:', encryptionError);
              throw new Error('Failed to secure birth date information');
            }
          }

          const { data, error } = await profiles.update(user.id, updates);
          if (error) throw error;
          set({ profile: data });
          return { success: true, data };
        } catch (error) {
          // Handle age verification errors specifically
          if (error.code === 'COPPA_AGE_RESTRICTION' || error.code === 'AGE_VERIFICATION_FAILED') {
            set({ error: error.message });
            return { success: false, error: error.message, code: error.code };
          }

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
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ loading: false });
        }
      },
      // Get decrypted birth date (for admin/verification purposes only)
      getDecryptedBirthDate: async () => {
        try {
          const user = get().user;
          const profile = get().profile;

          if (!user || !profile) {
            throw new Error('No user logged in');
          }

          if (!profile.encrypted_birth_date) {
            // Check for legacy plain text date
            return profile.date_of_birth || null;
          }

          const { decryptBirthDate } = await import('../services/encryption-service');
          return await decryptBirthDate(profile.encrypted_birth_date, user.email);
        } catch (error) {
          console.error('Failed to decrypt birth date:', error);
          return null;
        }
      },

      // Check if user has encrypted birth date
      hasEncryptedBirthDate: () => {
        const profile = get().profile;
        return profile?.encrypted_birth_date != null;
      },

      // Get user age without exposing birth date
      getUserAge: async () => {
        try {
          const user = get().user;
          const profile = get().profile;

          if (!user || !profile) {
            return null;
          }

          if (profile.encrypted_birth_date) {
            const { getAgeFromEncryptedBirthDate } = await import('../services/encryption-service');
            return await getAgeFromEncryptedBirthDate(profile.encrypted_birth_date, user.email);
          } else if (profile.date_of_birth) {
            // Legacy plain text calculation
            const birth = new Date(profile.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
              age--;
            }
            return age;
          }

          return null;
        } catch (error) {
          console.error('Failed to calculate user age:', error);
          return null;
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