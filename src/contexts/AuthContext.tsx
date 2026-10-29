import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { UserProfile, SellerStore } from '../types';
import { apiRequest } from '../services/api';
import { supabase, isSupabaseConfigured, supabaseConfigDetails } from '../lib/supabase';

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  account_type?: 'customer' | 'seller';
  store_name?: string;
  craft_type?: string;
  bio?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  sellerStore: SellerStore | null;
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }>;
  register: (data: RegisterFormData) => Promise<{
    success: boolean;
    error?: string;
    emailConfirmationRequired?: boolean;
    message?: string;
  }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  applySeller: (data: any) => Promise<{ success: boolean; error?: string; message?: string }>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sellerStore, setSellerStore] = useState<SellerStore | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('craftora_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Reads the actual user's profile directly from public.profiles in Supabase (Requirement 5)
   * Strictly avoids any in-memory authentication fallback (Requirement 11)
   */
  const fetchUserProfile = async (userId: string, currentToken?: string | null): Promise<UserProfile | null> => {
    if (!supabase) return null;

    try {
      // 1. Read directly from public.profiles table in Supabase
      const { data: profileRow, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error querying public.profiles in Supabase:', error.message);
        // Do NOT use in-memory authentication fallback (Requirement 11)
        return null;
      }

      let profileData = profileRow;

      // In case of fresh signup, the database trigger on auth.users may take milliseconds to complete
      if (!profileData) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { data: retryRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        profileData = retryRow;
      }

      if (!profileData) {
        // Zero in-memory fallback (Requirement 11)
        console.warn('Profile record not found in public.profiles for user ID:', userId);
        setUser(null);
        return null;
      }

      const activeProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        phone: profileData.phone || undefined,
        avatar_url: profileData.avatar_url || undefined,
        role: profileData.role,
        bio: profileData.bio || undefined,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      };

      setUser(activeProfile);

      // Fetch optional seller store details if role is seller or admin
      if (currentToken) {
        try {
          const res = await apiRequest('/auth/me', {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (res.success && res.data?.sellerStore) {
            setSellerStore(res.data.sellerStore);
          } else {
            setSellerStore(null);
          }
        } catch {
          // Store loading failure is non-blocking
        }
      }

      return activeProfile;
    } catch (e: any) {
      console.error('Failed to load profile from public.profiles:', e);
      setUser(null);
      return null;
    }
  };

  // Initialize and listen to Supabase Auth State Changes (Requirement 4)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      setAuthError('Supabase is not configured. Please check your Supabase environment variables.');
      return;
    }

    let isMounted = true;

    // 1. Initial session restoration using getSession() (Requirement 4)
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;

      if (error) {
        console.error('Error fetching Supabase session via getSession():', error.message);
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }

      if (initialSession && initialSession.user) {
        setSession(initialSession);
        setToken(initialSession.access_token);
        localStorage.setItem('craftora_token', initialSession.access_token);
        // Requirement 5: Read the actual user's profile from public.profiles
        await fetchUserProfile(initialSession.user.id, initialSession.access_token);
        if (isMounted) setIsLoading(false);
      } else {
        localStorage.removeItem('craftora_token');
        setToken(null);
        setUser(null);
        setSellerStore(null);
        setIsLoading(false);
      }
    });

    // 2. Auth State Subscription using onAuthStateChange() (Requirement 4)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !currentSession || !currentSession.user) {
        setSession(null);
        setToken(null);
        setUser(null);
        setSellerStore(null);
        localStorage.removeItem('craftora_token');
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      setToken(currentSession.access_token);
      localStorage.setItem('craftora_token', currentSession.access_token);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await fetchUserProfile(currentSession.user.id, currentSession.access_token);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshAuth = async () => {
    if (!supabase || !session?.user) return;
    await fetchUserProfile(session.user.id, session.access_token);
  };

  /**
   * Real Supabase signInWithPassword (Requirement 2)
   */
  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase Authentication is not configured. Please check your environment variables.',
      };
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoading(false);
        const isUnconfirmed =
          error.message?.toLowerCase().includes('email not confirmed') ||
          error.message?.toLowerCase().includes('not confirmed');

        return {
          success: false,
          error: error.message,
          emailConfirmationRequired: isUnconfirmed,
        };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setToken(data.session.access_token);
        localStorage.setItem('craftora_token', data.session.access_token);

        // Read the actual profile from public.profiles (Requirement 5)
        const profile = await fetchUserProfile(data.user.id, data.session.access_token);
        setIsLoading(false);

        if (!profile) {
          return {
            success: false,
            error: 'Profile record not found in public.profiles. Please ensure your account has completed setup.',
          };
        }

        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Failed to establish an authenticated session.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login request failed.' };
    }
  };

  /**
   * Real Supabase signUp with metadata (Requirement 1 & 7 & 8)
   * - Never allows public signup to choose admin or management roles (Requirement 7)
   * - Does NOT insert profiles manually from the frontend. The DB trigger handles profile creation (Requirement 8)
   */
  const register = async (formData: RegisterFormData) => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase Authentication is not configured. Please check your environment variables.',
      };
    }

    try {
      setIsLoading(true);
      // Requirement 7: Never allow public signup to choose admin or management roles
      const accountType = formData.account_type === 'seller' ? 'seller' : 'customer';

      // Requirement 1: Use supabase.auth.signUp() for registration
      // Requirement 8: Do not insert profiles manually from frontend - database trigger handles creation
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            phone: formData.phone?.trim() || '',
            account_type: accountType,
            store_name: formData.store_name?.trim() || '',
            craft_type: formData.craft_type?.trim() || '',
            bio: formData.bio?.trim() || '',
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      let signUpError = error;
      let signUpData = data;

      // If client-side signUp fails due to rate limits or browser network policies ("Failed to fetch" / "email rate limit")
      if (signUpError) {
        console.warn('Direct Supabase signUp failed:', signUpError.message, '- attempting verified server route...');
        const serverReg = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            full_name: formData.full_name.trim(),
            phone: formData.phone?.trim() || '',
            account_type: accountType,
            store_name: formData.store_name?.trim() || '',
            craft_type: formData.craft_type?.trim() || '',
            bio: formData.bio?.trim() || '',
          }),
        });

        if (serverReg.success) {
          // Immediately log in with new credentials to acquire real session
          const loginRes = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password,
          });

          if (loginRes.data.session && loginRes.data.user) {
            setSession(loginRes.data.session);
            setToken(loginRes.data.session.access_token);
            localStorage.setItem('craftora_token', loginRes.data.session.access_token);
            await fetchUserProfile(loginRes.data.user.id, loginRes.data.session.access_token);
            setIsLoading(false);
            return { success: true };
          }

          setIsLoading(false);
          return {
            success: true,
            message: 'Account created! Please sign in with your credentials.',
          };
        } else {
          setIsLoading(false);
          return { success: false, error: serverReg.error || signUpError.message };
        }
      }

      // Requirement 9: Show email verification instructions when required
      if (signUpData?.user && !signUpData?.session) {
        setIsLoading(false);
        return {
          success: true,
          emailConfirmationRequired: true,
          message: `A verification email has been sent to ${formData.email}. Please verify your email before logging in.`,
        };
      }

      // If auto-confirmed or session immediately created
      if (signUpData?.session && signUpData?.user) {
        setSession(signUpData.session);
        setToken(signUpData.session.access_token);
        localStorage.setItem('craftora_token', signUpData.session.access_token);

        // Read the actual profile from public.profiles populated by trigger
        await fetchUserProfile(signUpData.user.id, signUpData.session.access_token);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase signUp threw error:', err.message, '- attempting verified server route...');
      try {
        const accountType = formData.account_type === 'seller' ? 'seller' : 'customer';
        const serverReg = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            full_name: formData.full_name.trim(),
            phone: formData.phone?.trim() || '',
            account_type: accountType,
            store_name: formData.store_name?.trim() || '',
            craft_type: formData.craft_type?.trim() || '',
            bio: formData.bio?.trim() || '',
          }),
        });

        if (serverReg.success) {
          const loginRes = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password,
          });

          if (loginRes.data?.session && loginRes.data?.user) {
            setSession(loginRes.data.session);
            setToken(loginRes.data.session.access_token);
            localStorage.setItem('craftora_token', loginRes.data.session.access_token);
            await fetchUserProfile(loginRes.data.user.id, loginRes.data.session.access_token);
            setIsLoading(false);
            return { success: true };
          }

          setIsLoading(false);
          return {
            success: true,
            message: 'Account created! Please log in.',
          };
        } else {
          setIsLoading(false);
          return { success: false, error: serverReg.error || err.message };
        }
      } catch (fallbackErr: any) {
        setIsLoading(false);
        return { success: false, error: fallbackErr.message || err.message || 'Registration request failed.' };
      }
    }
  };

  /**
   * Resends verification email for unconfirmed accounts (Requirement 9)
   */
  const resendVerificationEmail = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: `A new verification email has been sent to ${email}. Please check your inbox and spam folders.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend verification email.' };
    }
  };

  /**
   * Real Supabase signOut (Requirement 3)
   */
  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Error during Supabase sign out:', e);
    } finally {
      setUser(null);
      setSellerStore(null);
      setSession(null);
      setToken(null);
      localStorage.removeItem('craftora_token');
      localStorage.removeItem('craftora_supabase_auth_token');
    }
  };

  /**
   * Password recovery initiation
   */
  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const redirectUrl = `${window.location.origin}#reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${email}. Please check your inbox.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset failed.' };
    }
  };

  /**
   * Complete password update (when in recovery session)
   */
  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  };

  /**
   * Updates user profile fields
   */
  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const res = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating profile:', e);
      return false;
    }
  };

  /**
   * Submits artisan application for current authenticated user
   */
  const applySeller = async (data: any) => {
    return apiRequest('/auth/apply-seller', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sellerStore,
        session,
        token,
        isLoading,
        isConfigured: isSupabaseConfigured,
        authError,
        login,
        register,
        resendVerificationEmail,
        logout,
        resetPassword,
        updatePassword,
        updateProfile,
        applySeller,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
