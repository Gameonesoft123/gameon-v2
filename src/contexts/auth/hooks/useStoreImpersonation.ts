
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthUser } from '../types';

export function useStoreImpersonation() {
  const [impersonatingStore, setImpersonatingStore] = useState(false);
  const [impersonatedStoreId, setImpersonatedStoreId] = useState<string | null>(null);
  const [originalUser, setOriginalUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();

  const impersonateStore = async (storeId: string, isSuperAdmin: boolean, currentUser: AuthUser | null) => {
    if (!isSuperAdmin) {
      return { success: false, error: "Only Super Admins can impersonate stores" };
    }

    try {
      if (!currentUser) {
        return { success: false, error: "Not authenticated" };
      }
      
      const { data: storeData, error: storeError } = await supabase.from('stores')
        .select('name')
        .eq('id', storeId)
        .single();
      
      if (storeError || !storeData) {
        return { success: false, error: "Store not found" };
      }
      
      setOriginalUser(currentUser);
      
      const storeName = storeData.name !== null ? String(storeData.name) : 'Unknown Store';
      
      const impersonatedUser = {
        id: `impersonated-${storeId}`,
        email: 'store@example.com',
        role: 'owner',
        user_metadata: {
          name: 'Store Owner',
          impersonated: true,
        },
        store_id: storeId,
        store_name: storeName
      };
      
      setImpersonatingStore(true);
      setImpersonatedStoreId(storeId);
      
      toast.success(`Now impersonating store: ${storeName}. Sign out to return to Super Admin.`);
      navigate('/');
      
      return { success: true, impersonatedUser };
    } catch (error: any) {
      console.error("Error impersonating store:", error);
      return { success: false, error: error.message };
    }
  };

  const endImpersonation = () => {
    if (impersonatingStore && originalUser) {
      const user = originalUser;
      setImpersonatingStore(false);
      setImpersonatedStoreId(null);
      setOriginalUser(null);
      toast.success("Ended store impersonation");
      navigate('/admin-dashboard');
      return { success: true, user };
    }
    return { success: false, error: "Not currently impersonating" };
  };

  return {
    impersonatingStore,
    impersonatedStoreId,
    originalUser,
    impersonateStore,
    endImpersonation,
    setImpersonatingStore,
    setImpersonatedStoreId,
    setOriginalUser
  };
}
