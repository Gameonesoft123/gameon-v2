
import { useCallback } from 'react';
import { staffLoginUtil } from '../authUtils';
import { AuthUser } from '../types';

export function useStaffLogin(setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>, resetRedirectCounter: () => void) {
  const staffLogin = useCallback(async (usernameOrEmail: string, password: string) => {
    try {
      const result = await staffLoginUtil(usernameOrEmail, password);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        // Clear any redirect loop detection
        resetRedirectCounter();
        return { success: true };
      }
      
      return { success: false, error: result.error || "Invalid credentials" };
    } catch (error: any) {
      console.error("Staff login error:", error);
      return { success: false, error: error.message };
    }
  }, [setCurrentUser, resetRedirectCounter]);

  return { staffLogin };
}
