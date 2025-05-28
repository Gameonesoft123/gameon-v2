import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = "https://wgqvihhdxutfjuptnyrg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncXZpaGhkeHV0Zmp1cHRueXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTc1NzEsImV4cCI6MjA1OTE5MzU3MX0.7Ye94pGgLd2YHm77yJX9CoWqGt9FPBNqhrV_bmqbr7k"; // Added export here

// Create client with explicit config for better auth reliability
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'sb-wgqvihhdxutfjuptnyrg-auth-token',
  }
});

// Export typed versions for direct table access
export type Tables = Database['public']['Tables'];

/**
 * Helper function for accessing tables that might not be in the type definition yet
 */
export function customTable(name: string) {
  return supabase.from(name as any);
}

// Enhanced version to clear auth state completely
export const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    // Clear all Supabase-related items
    localStorage.removeItem('sb-wgqvihhdxutfjuptnyrg-auth-token');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.refresh_token');

    // Clear our custom auth items
    localStorage.removeItem('auth_success');
    localStorage.removeItem('auth_return_url');
    localStorage.removeItem('auth_redirects');
    sessionStorage.removeItem('auth_redirects');
    sessionStorage.removeItem('supabase.auth.token');

    // Clear any potential error states
    localStorage.removeItem('supabase.auth.error');

    console.log("Auth state completely cleared from localStorage");
    return true;
  }
  return false;
};

// Enhanced session refresh with retries
export const refreshSession = async (retries = 1) => {
  try {
    console.log(`Attempting to refresh session... (attempt ${3 - retries})`);
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      if (retries > 0) {
        console.log(`Retry attempt remaining: ${retries}`);
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        return refreshSession(retries - 1);
      }
      throw error;
    }

    if (!data.session) {
      if (retries > 0) {
        console.log("No session returned, retrying...");
        await new Promise(resolve => setTimeout(resolve, 500));
        return refreshSession(retries - 1);
      }
      return { success: false, error: "No session returned from refresh" };
    }

    console.log("Session refreshed successfully:", data.session?.user?.id);
    return { success: true, session: data.session };
  } catch (error) {
    console.error("Failed to refresh session:", error);
    return { success: false, error };
  }
};

// Helper to check if there's actually a valid token in storage
export const checkTokenInStorage = () => {
  try {
    if (typeof window === 'undefined') return false;

    const tokenString = localStorage.getItem('sb-wgqvihhdxutfjuptnyrg-auth-token');
    if (!tokenString) {
      console.log("No token in storage");
      return false;
    }

    const token = JSON.parse(tokenString);
    const expiresAt = token?.expires_at;

    if (!expiresAt) {
      console.log("Token has no expiration");
      return false;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const isValid = expiresAt > now;
    const expiresIn = expiresAt - now;
    console.log(`Token valid: ${isValid}, expires in ${expiresIn} seconds`);

    return {
      isValid,
      expiresIn,
      userId: token?.user?.id
    };
  } catch (e) {
    console.error("Error checking token:", e);
    return false;
  }
};

// Get the current auth state from storage directly
export const getAuthStateFromStorage = () => {
  try {
    if (typeof window === 'undefined') return null;

    const tokenString = localStorage.getItem('sb-wgqvihhdxutfjuptnyrg-auth-token');
    if (!tokenString) return null;

    return JSON.parse(tokenString);
  } catch (e) {
    console.error("Error reading auth state from storage:", e);
    return null;
  }
};

// Add a function to prevent redirect loops
export const preventRedirectLoop = () => {
  try {
    if (typeof window === 'undefined') return false;

    // Get current count of redirects in this session
    const redirects = parseInt(sessionStorage.getItem('auth_redirects') || '0', 10);

    // If too many redirects, stop
    if (redirects > 5) {
      console.error("⚠️ Too many auth redirects detected - stopping redirect loop");
      return true;
    }

    // Increment redirect count
    sessionStorage.setItem('auth_redirects', (redirects + 1).toString());
    return false;
  } catch (e) {
    return false;
  }
};

// Reset redirect counter
export const resetRedirectCounter = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_redirects');
  }
};

// Function to create a store with admin/service role
export const createStoreWithServiceRole = async (storeName: string) => {
  try {
    console.log("Attempting to create store with name:", storeName);

    // Call edge function to create store with service role
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`
      },
      body: JSON.stringify({
        user_id: session.session.user.id,
        store_name: storeName
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edge function error:", errorText);
      return { success: false, error: `Server error: ${response.status} ${errorText}` };
    }

    const result = await response.json();

    if (!result.success || !result.store_id) {
      console.error("Edge function returned error:", result);
      return { success: false, error: result.error || "Unknown error creating store" };
    }

    console.log("Store created successfully via edge function:", result.store_id);
    return { success: true, storeId: result.store_id };
  } catch (error: any) {
    console.error("Exception while creating store:", error);
    return { success: false, error: error.message };
  }
};

// Function to update profile store_id
export const updateUserProfileStoreId = async (userId: string, storeId: string) => {
  if (!userId || !storeId) {
    console.error("Missing userId or storeId for profile update");
    return { success: false, error: "Missing user ID or store ID" };
  }

  try {
    console.log(`Updating profile for user ${userId} with store ID ${storeId}`);

    // Call the edge function to update the profile
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`
      },
      body: JSON.stringify({
        user_id: userId,
        store_name: "Updated Store", // The function will only update the store_id, not rename it
        update_only: true,
        store_id: storeId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edge function error:", errorText);
      return { success: false, error: `Server error: ${response.status} ${errorText}` };
    }

    const result = await response.json();

    if (!result.success) {
      console.error("Edge function returned error:", result);
      return { success: false, error: result.error || "Unknown error updating profile" };
    }

    console.log("Profile updated successfully via edge function");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile store_id:", error);
    return { success: false, error: error.message };
  }
};
