
import { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { supabase, clearAuthState } from '@/integrations/supabase/client';
import { buildUserFromSession } from '../authUtils';

export function useAuthInitialization() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("Initializing auth system...");
    let isSubscribed = true;
    let initTimeoutId: number | undefined;

    // Set an initialization timeout
    initTimeoutId = window.setTimeout(() => {
      if (isSubscribed && loading) {
        console.warn("Auth initialization timeout");
        setLoading(false);
        setAuthInitialized(true);
        setAuthError(new Error("Authentication initialization timeout"));
      }
    }, 6000);
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event);
      
      if (!isSubscribed) return;

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        try {
          if (session?.user) {
            console.log(`Building user from session for: ${session.user.email}`);
            const userObj = await buildUserFromSession(session);
            if (userObj) {
              setCurrentUser(userObj);
              console.log(`Auth state changed - user authenticated: ${userObj.email}`);
            } else {
              console.warn("Failed to build user from session");
              setAuthError(new Error("Failed to build user from session"));
            }
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
          setAuthError(error instanceof Error ? error : new Error(String(error)));
          // Clear potentially corrupted auth state
          await clearAuthState();
        } finally {
          if (isSubscribed) {
            setLoading(false);
            setAuthInitialized(true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isSubscribed) {
          setCurrentUser(null);
          console.log("Auth state changed - user signed out");
          // Ensure we clear all auth state
          await clearAuthState();
          setLoading(false);
          setAuthInitialized(true);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Session was updated with a fresh token, no need to rebuild user
        console.log("Auth token refreshed");
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    });

    // Check for existing session on component mount
    const checkCurrentSession = async () => {
      try {
        if (!isSubscribed) return;

        // Get current session if it exists
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session:", error);
          await clearAuthState();
          setAuthError(error);
          throw error;
        }
        
        if (session) {
          console.log(`Found existing session: ${session.user.email}`);
          const userObj = await buildUserFromSession(session);
          if (userObj) {
            setCurrentUser(userObj);
            console.log(`User authenticated with store_id: ${userObj.store_id}`);
          } else {
            console.warn("Found session but failed to build user");
            setAuthError(new Error("Failed to build user from existing session"));
          }
        } else {
          console.log("No existing session found");
          await clearAuthState();
        }
      } catch (error) {
        console.error("Error checking session:", error);
        await clearAuthState();
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    checkCurrentSession();

    return () => {
      isSubscribed = false;
      if (initTimeoutId) window.clearTimeout(initTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return {
    currentUser,
    setCurrentUser,
    loading,
    setLoading,
    authInitialized,
    authError
  };
}
