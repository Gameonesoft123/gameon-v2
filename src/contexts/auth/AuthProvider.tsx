
import React, { useEffect } from 'react';
import { supabase, resetRedirectCounter } from '@/integrations/supabase/client';
import { AuthContext } from './AuthContext';
import { AuthUser, AuthContextType, SupabaseOAuthSignInOptions } from './types'; // Added SupabaseOAuthSignInOptions
import { useAuthInitialization } from './hooks/useAuthInitialization';
import { useAuthActions } from './hooks/useAuthActions';
import { useStaffLogin } from './hooks/useStaffLogin';
import { useStoreImpersonation } from './hooks/useStoreImpersonation';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use our custom hooks for different parts of auth functionality
  const { 
    currentUser, 
    setCurrentUser, 
    loading, 
    setLoading, // setLoading is available from the hook if needed, but we aim to rely on the hook's internal logic
    authInitialized,
    // authError // authError from useAuthInitialization can be used if needed
  } = useAuthInitialization();

  const {
    impersonatingStore,
    impersonatedStoreId,
    originalUser,
    impersonateStore: impersonateStoreHandler,
    endImpersonation: endImpersonationHandler,
    setImpersonatingStore,
    setImpersonatedStoreId,
    setOriginalUser
  } = useStoreImpersonation();

  const { staffLogin } = useStaffLogin(setCurrentUser, resetRedirectCounter);

  const {
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateUser,
    signInWithFaceId,
    signInWithOAuth,
  } = useAuthActions(
    setCurrentUser, 
    setLoading, // Pass setLoading to auth actions
    impersonatingStore, 
    originalUser,
    endImpersonationHandler
  );

  // Derived state
  const isAdmin = currentUser?.role === 'admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const userRole = currentUser?.role || null;
  const currentStoreId = impersonatingStore ? impersonatedStoreId : currentUser?.store_id || null;

  // Store impersonation wrapper
  const impersonateStore = async (storeId: string) => {
    const result = await impersonateStoreHandler(storeId, isSuperAdmin, currentUser);
    if (result.success && result.impersonatedUser) {
      setCurrentUser(result.impersonatedUser);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // Add refreshUser function for fetching up-to-date user data
  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      // setLoading(true); // Managed by useAuthInitialization or specific actions
      console.log("Refreshing user data...");
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!session?.user) {
        console.log("No session available for refresh");
        setCurrentUser(null); // Ensure user is cleared if no session
        return null;
      }
      
      const userId = session.user.id;
      const email = session.user.email || '';
      const userMetadata = session.user.user_metadata || {};
      
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: row not found, which is fine
        console.error("Error fetching profile:", profileError);
        // Potentially throw to indicate refresh failure, or handle gracefully
      }
      
      // Determine store ID from profile or metadata
      const storeId = profile?.store_id || userMetadata.store_id || null;
      
      // Get store name if we have a store ID
      let storeName: string | null = userMetadata.store_name || null;
      
      if (storeId && profile?.store_id) { // Prioritize profile store_id for store name lookup
        try {
          const { data: storeData } = await supabase
            .from('stores')
            .select('name')
            .eq('id', storeId)
            .maybeSingle();
            
          if (storeData?.name) {
            storeName = storeData.name;
            console.log(`Found store name: ${storeName} for ID: ${storeId}`);
          }
        } catch (storeError) {
          console.error("Error fetching store name:", storeError);
          // Continue with other data
        }
      }
      
      // Build the enhanced user object
      const enhancedUser: AuthUser = {
        id: userId,
        email: email,
        store_id: storeId,
        role: profile?.role || userMetadata.role || 'user',
        store_name: storeName,
        user_metadata: userMetadata
      };
      
      console.log("Refreshed user data:", enhancedUser);
      setCurrentUser(enhancedUser);
      return enhancedUser;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setCurrentUser(null); // Clear user on error
      return null;
    } finally {
      // setLoading(false); // Managed by useAuthInitialization or specific actions
    }
  };

  // Removed the useEffect block with quickTimeoutId, mediumTimeoutId, and emergencyTimeoutId.
  // We will rely on the loading and authInitialized states from useAuthInitialization.

  // Final auth context value
  const value: AuthContextType = {
    currentUser,
    user: currentUser, // user is often an alias for currentUser
    loading: loading || !authInitialized, // This combines hook's loading & initialization status
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateUser,
    signInWithFaceId,
    signInWithOAuth,
    isAdmin,
    isSuperAdmin,
    userRole,
    staffLogin,
    impersonateStore,
    endImpersonation: endImpersonationHandler,
    impersonatingStore,
    impersonatedStoreId,
    currentStoreId,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

