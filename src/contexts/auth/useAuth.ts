
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { toast } from 'sonner';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    const error = 'useAuth must be used within an AuthProvider';
    console.error(error);
    toast.error(error);
    throw new Error(error);
  }
  
  // Log the store ID for debugging purposes
  if (context.currentUser?.store_id) {
    console.debug('Current user store_id:', context.currentUser.store_id);
  } else {
    console.debug('No store_id found for current user');
  }
  
  return context;
};
