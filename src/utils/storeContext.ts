
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

/**
 * Gets the current user's store_id from their profile
 * @returns The store_id or null if there was an error
 */
export async function getStoreContext() {
  try {
    // First try to get profile from database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('store_id')
      .single();

    if (profileError) {
      console.error("Error fetching user's store from profiles:", profileError);
      
      // As a fallback, try to get store from user metadata
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Error fetching auth user:", authError);
        toast.error("Failed to get store context");
        return null;
      }
      
      if (user?.user_metadata?.store_id) {
        console.log("Retrieved store_id from user metadata:", user.user_metadata.store_id);
        return user.user_metadata.store_id;
      }
      
      toast.error("Failed to get store context");
      return null;
    }

    // Check if store_id is the fallback UUID
    if (profileData?.store_id === '00000000-0000-0000-0000-000000000000') {
      console.error("No valid store_id found in user profile");
      toast.error("Store not setup. Please update your profile first.");
      return null;
    }

    return profileData.store_id;
  } catch (error) {
    console.error("Unexpected error getting store context:", error);
    toast.error("Failed to get store context");
    return null;
  }
}

/**
 * React hook to access the store context
 * @returns Store context object with storeId and loading state
 */
export function useStoreContext() {
  const { currentUser } = useAuth();
  return {
    storeId: currentUser?.store_id || null,
    hasStore: currentUser?.store_id && currentUser.store_id !== '00000000-0000-0000-0000-000000000000',
    storeName: currentUser?.store_name || null
  };
}
