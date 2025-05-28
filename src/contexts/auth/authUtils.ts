
import { Session } from '@supabase/supabase-js';
import { AuthUser } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function buildUserFromSession(session: Session): Promise<AuthUser | null> {
  try {
    if (!session?.user) {
      return null;
    }

    console.log("Building user from session for:", session.user.email);

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileError);
    }

    console.log("Profile data:", profile);

    // Determine store_id from profile or user metadata
    const storeId = profile?.store_id || session.user.user_metadata?.store_id || null;
    console.log("Store ID determined:", storeId);

    // If there's a store_id, try to get the store name
    let storeName = null;
    if (storeId) {
      try {
        const { data: storeData } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .maybeSingle();

        if (storeData?.name) {
          storeName = storeData.name;
        }
      } catch (storeError) {
        console.error("Error fetching store:", storeError);
      }
    }

    // Use storeName from metadata if we couldn't get it from the database
    if (!storeName && session.user.user_metadata?.store_name) {
      storeName = session.user.user_metadata.store_name;
      console.log("Using store name from metadata:", storeName);
    }

    // Construct the user object
    const userObj: AuthUser = {
      id: session.user.id,
      email: session.user.email || '',
      store_id: storeId,
      role: profile?.role || session.user.user_metadata?.role || 'user',
      store_name: storeName,
      user_metadata: session.user.user_metadata || {}
    };

    console.log("Constructed user object:", userObj);
    return userObj;
  } catch (error) {
    console.error("Error building user from session:", error);
    return null;
  }
}

// Updated staff login utility to properly handle admin login
export async function staffLoginUtil(usernameOrEmail: string, password: string) {
  try {
    console.log("Attempting staff login for:", usernameOrEmail);
    
    // Special case for admin hardcoded credentials
    if (usernameOrEmail === 'admin@gameon.com' && password === 'admin123') {
      // Create admin user object
      const adminUser: AuthUser = {
        id: '00000000-0000-0000-0000-000000000001', // Special admin ID
        email: 'admin@gameon.com',
        store_id: null, // Admins don't have a specific store
        role: 'super_admin',
        store_name: null,
        user_metadata: {
          is_admin: true,
          is_super_admin: true,
          first_name: 'System',
          last_name: 'Admin'
        }
      };
      
      console.log("Admin credentials validated, returning super_admin user");
      return { 
        success: true, 
        user: adminUser 
      };
    }
    
    // For non-admin staff members, check the staff table
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
      .maybeSingle();
      
    if (staffError) {
      console.error("Error finding staff member:", staffError);
      return { success: false, error: "Failed to find staff member" };
    }
    
    if (!staffData) {
      console.log("Staff member not found:", usernameOrEmail);
      return { success: false, error: "Staff member not found" };
    }
    
    // In a real application, we would hash the password and compare it properly
    // This is a simplified version for demo purposes
    if (staffData.password_hash !== `hashed_${password}`) {
      console.log("Invalid staff password for:", usernameOrEmail);
      return { success: false, error: "Invalid password" };
    }
    
    // Get store information
    const { data: storeData } = await supabase
      .from('stores')
      .select('name')
      .eq('id', staffData.store_id)
      .maybeSingle();
      
    // Create staff user object
    const staffUser: AuthUser = {
      id: staffData.id,
      email: staffData.email,
      store_id: staffData.store_id,
      role: staffData.role,
      store_name: storeData?.name || null,
      user_metadata: {
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        is_staff: true
      }
    };
    
    console.log("Staff login successful for:", staffData.email);
    return { 
      success: true, 
      user: staffUser 
    };
  } catch (error) {
    console.error("Staff login error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
