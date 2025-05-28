
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, resetRedirectCounter, updateUserProfileStoreId, clearAuthState } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthUser, AuthResult, SupabaseOAuthSignInOptions } from '../types';
import { buildUserFromSession } from '../authUtils';

export function useAuthActions(
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  impersonatingStore: boolean,
  originalUser: AuthUser | null,
  endImpersonation: () => { success: boolean; error?: string; user?: AuthUser }
) {
  const navigate = useNavigate();

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      console.log("Attempting sign in for:", email);
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log("Sign in successful, session:", data.session);
      
      resetRedirectCounter();
      // Use buildUserFromSession to construct AuthUser from Supabase session
      const authUser = data.session ? await buildUserFromSession(data.session) : null;
      if (authUser) {
        setCurrentUser(authUser); // Ensure context is updated by buildUserFromSession result
         return { success: true, user: authUser };
      } else {
        // This case should ideally not happen if sign-in is successful and session exists
        console.error("Sign in successful but failed to build user from session.");
        return { success: false, error: "Failed to retrieve user details after sign in." };
      }
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      toast.error(error.message || "Failed to sign in");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCurrentUser, buildUserFromSession]);

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      if (impersonatingStore && originalUser) {
        const result = endImpersonation();
        if (result.success && result.user) {
          setCurrentUser(result.user);
        }
        setLoading(false);
        navigate(result.user?.role === 'super_admin' ? '/admin-dashboard' : '/', { replace: true });
        return;
      }

      console.log("Signing out user");
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out from Supabase:", error.message);
        // Don't throw, try to clear client state anyway
      }
      
      await clearAuthState(); // Clears local storage/session storage
      setCurrentUser(null); // Clears context state
      
      console.log("Sign out completed, redirecting to /auth");
      navigate('/auth', { replace: true });
    } catch (error: any) {
      console.error("Critical error during sign out process:", error.message);
      toast.error(error.message || "Failed to sign out completely");
      // Ensure client state is cleared even on error
      await clearAuthState();
      setCurrentUser(null);
      navigate('/auth', { replace: true }); // Force redirect
    } finally {
      setLoading(false);
    }
  }, [impersonatingStore, originalUser, navigate, setCurrentUser, setLoading, endImpersonation]);

  const signUp = useCallback(async (email: string, password: string, storeName?: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      console.log("Signing up user with email:", email);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          data: { 
            role: 'owner', // Default role
            store_name: storeName || null, // Store name in user_metadata
            company: storeName || null
          } 
        } 
      });
      
      if (error) throw error;
      
      // Check if user is already confirmed (identities is empty usually means new user or unconfirmed existing)
      // A better check might be if data.user exists but data.session is null for an unconfirmed user.
      // For new users data.user.identities will be empty until confirmed. If it's an existing unconfirmed user, this also holds.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        console.warn("Sign up attempt for existing unconfirmed user or new user awaiting confirmation:", email);
        // This message applies if "Confirm email" is ON in Supabase Auth settings.
        // If "Confirm email" is OFF, user is active immediately.
        toast.info("Please check your email to confirm your account. If already registered and unconfirmed, the confirmation email may have been resent.");
        navigate('/auth/verify-email'); // Redirect to a page that explains email verification
        // Success is true because the signup request itself was processed.
        // The user object might be available in data.user here.
        return { success: true, message: "Confirmation email sent or user needs to confirm." };
      }
      
      console.log("Sign up successful, user data:", data.user);
      // This toast implies immediate success, which is true if "Confirm email" is OFF.
      // If "Confirm email" is ON, this toast might be misleading.
      toast.success("Sign up successful! Please check your email to verify your account.");
      navigate('/auth/verify-email');
      return { success: true, user: data.user ? await buildUserFromSession(data.session!) : undefined }; // Pass user if available
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      if (error.message.includes("User already registered")) {
        toast.error("This email is already registered. Please try logging in.");
      } else {
        toast.error(error.message || "Failed to sign up");
      }
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [navigate, setLoading, buildUserFromSession]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`, // Ensure this route exists
      });
      if (error) throw error;
      toast.success("Password reset email sent. Check your inbox.");
      navigate('/auth'); // Navigate to login or a confirmation page
      return { success: true };
    } catch (error: any) {
      console.error("Error resetting password:", error.message);
      toast.error(error.message || "Failed to send reset password email");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, navigate]);

  const updateUser = useCallback(async (updates: { data?: { [key: string]: any; store_id?: string; }; email?: string; password?: string; }): Promise<AuthResult> => {
    setLoading(true);
    try {
      console.log("Updating user with:", updates);
      
      // If store_id is being updated in user_metadata (or a separate profile field)
      if (updates.data?.store_id) {
        console.log("Updating store_id in profile:", updates.data.store_id);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated for profile update.");
        
        // This assumes updateUserProfileStoreId updates the 'profiles' table
        const profileResult = await updateUserProfileStoreId(user.id, updates.data.store_id);
        if (!profileResult.success) {
          console.error("Failed to update profile store ID:", profileResult.error);
          throw new Error("Failed to update profile: " + profileResult.error);
        }
      }
      
      // Prepare payload for supabase.auth.updateUser
      // This updates auth.users table (email, password, user_metadata)
      const authUpdatePayload: { email?: string; password?: string; data?: any } = {};
      if (updates.email) authUpdatePayload.email = updates.email;
      if (updates.password) authUpdatePayload.password = updates.password;
      // `updates.data` here usually refers to `user_metadata`
      if (updates.data && Object.keys(updates.data).length > 0) {
        authUpdatePayload.data = updates.data;
      }
      
      const { error: updateError } = await supabase.auth.updateUser(authUpdatePayload);
      if (updateError) throw updateError;
      
      // Refresh session to get updated user info (especially if email changed)
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError) console.warn("Failed to refresh session after update:", sessionError.message);
      
      if (session) {
        const refreshedUser = await buildUserFromSession(session); // Use utility to get AuthUser
        if (refreshedUser) {
          setCurrentUser(refreshedUser); // Update context
          console.log("User data refreshed in context:", refreshedUser);
        }
      } else {
        // This might happen if email verification is required for new email
        console.warn("Session became null after user update. User might need to re-authenticate or verify email.");
      }
      
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Error updating user:", error.message);
      toast.error(`Failed to update profile: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setCurrentUser, setLoading, buildUserFromSession]);

  const signInWithFaceId = useCallback(async (externalImageId: string): Promise<AuthResult> => {
    setLoading(true);
    console.log("Attempting sign in with Face ID (ExternalImageId):", externalImageId.substring(0,10) + "...");
    try {
      // 1. Find user_id from auth_user_face_logins table
      const { data: faceLoginData, error: faceLoginError } = await supabase
        .from('auth_user_face_logins')
        .select('user_id')
        .eq('external_image_id', externalImageId)
        .single();

      if (faceLoginError || !faceLoginData) {
        console.error("Face ID not found or error querying:", faceLoginError?.message);
        toast.error("Face ID not recognized or not linked to an account.");
        return { success: false, error: "Face ID not recognized or not linked to an account." };
      }

      const userId = faceLoginData.user_id;

      // 2. Fetch profile data for the user_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          role,
          store_id,
          stores (name)
        `)
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error("Profile not found for user_id:", userId, profileError?.message);
        toast.error("User account details not found for this Face ID.");
        return { success: false, error: "User account details not found." };
      }
      
      // 3. Construct AuthUser object.
      // This doesn't create a real Supabase session but updates the UI.
      // For a real session, a custom JWT or backend auth flow would be needed.
      const authUser: AuthUser = {
        id: profileData.id,
        email: profileData.email || 'email_not_found@example.com', // Fallback if email is missing
        role: profileData.role,
        store_id: profileData.store_id,
        // @ts-ignore - Supabase types might make stores an array, we expect single or null
        store_name: profileData.stores ? profileData.stores.name : null,
        user_metadata: {
          // For Face ID login, user_metadata from auth.users might not be directly available
          // without a real session. We can populate common fields if known.
          name: profileData.email, // Example, adjust as needed
          avatar_url: '', // Mock or leave empty
        },
      };
      
      setCurrentUser(authUser);
      resetRedirectCounter(); // Reset redirect counter for navigation
      
      // Navigate to the intended page or dashboard
      // The actual redirect destination might depend on user role or stored returnTo URL
      const returnTo = localStorage.getItem('auth_return_url') || (authUser.role === 'super_admin' ? '/admin-dashboard' : '/');
      navigate(returnTo, { replace: true });

      toast.success("Logged in successfully with Face ID!");
      return { success: true, user: authUser };

    } catch (error: any) {
      console.error("Error during Face ID sign in:", error.message);
      toast.error(error.message || "Failed to process Face ID login.");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setCurrentUser, navigate, buildUserFromSession]);

  const signInWithOAuth = useCallback(async (params: SupabaseOAuthSignInOptions): Promise<{ data: any; error: any | null }> => {
    setLoading(true);
    try {
      console.log(`Attempting OAuth sign-in with provider: ${params.provider}`);
      const { data, error } = await supabase.auth.signInWithOAuth(params);
      if (error) {
        console.error(`OAuth sign-in error with ${params.provider}:`, error.message);
        toast.error(error.message || `Failed to sign in with ${params.provider}`);
        return { data: null, error };
      }
      // If successful and no skipBrowserRedirect, Supabase handles the redirect.
      // If skipBrowserRedirect is true, data.url will contain the URL.
      console.log(`OAuth sign-in initiated with ${params.provider}. Data:`, data);
      // Typically, no further action is needed here client-side if a redirect is happening.
      // Toast for initiation can be good.
      if (!params.options?.skipBrowserRedirect) {
         toast.info(`Redirecting to ${params.provider} for sign-in...`);
      }
      return { data, error: null };
    } catch (error: any) {
      console.error(`Critical error during OAuth sign-in with ${params.provider}:`, error.message);
      toast.error(error.message || `Failed to initiate sign-in with ${params.provider}`);
      return { data: null, error };
    } finally {
      // setLoading(false) might not be reached if redirect occurs.
      // If skipBrowserRedirect is true or an error occurs before redirect, this will run.
      if (params.options?.skipBrowserRedirect || !supabase.auth.signInWithOAuth) {
         setLoading(false);
      }
    }
  }, [setLoading]);

  return {
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateUser,
    signInWithFaceId,
    signInWithOAuth, // Add the new function here
  };
}

