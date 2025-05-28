
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  store_id: string | null;
  role: string;
  store_name: string | null;
  user_metadata: Record<string, any>;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser; // Added user property
  message?: string; // Added message property
}

// Define a more specific type for OAuth options based on Supabase client
export interface SupabaseOAuthSignInOptions {
  provider: 'google' | 'github' | 'azure' | 'bitbucket' | 'gitlab' | 'apple' | 'discord' | 'facebook' | 'figma' | 'fly' | 'keycloak' | 'linkedin' | 'notion' | 'slack' | 'spotify' | 'twitch' | 'twitter' | 'workos' | 'zoom'; // Removed generic string
  options?: {
    redirectTo?: string;
    scopes?: string;
    queryParams?: { [key: string]: string };
    skipBrowserRedirect?: boolean;
  };
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, storeName?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateUser: (updates: Record<string, any>) => Promise<AuthResult>;
  signInWithFaceId: (faceId: string) => Promise<AuthResult>;
  signInWithOAuth: (params: SupabaseOAuthSignInOptions) => Promise<{ data: any; error: any | null }>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: string | null;
  staffLogin: (username: string, password: string) => Promise<AuthResult>;
  impersonateStore: (storeId: string) => Promise<AuthResult>;
  endImpersonation: () => { success: boolean; error?: string; user?: AuthUser };
  impersonatingStore: boolean;
  impersonatedStoreId: string | null;
  currentStoreId: string | null;
  refreshUser: () => Promise<AuthUser | null>;
}

