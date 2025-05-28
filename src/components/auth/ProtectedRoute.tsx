
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { resetRedirectCounter, clearAuthState } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type AllowedRole = 'owner' | 'manager' | 'employee' | 'admin' | 'super_admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: AllowedRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  allowedRoles = []
}) => {
  const { currentUser, loading, isAdmin, userRole } = useAuth();
  const location = useLocation();
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // Clear any redirect counters when successfully on a protected page with valid user
    if (currentUser) {
      resetRedirectCounter();
    }
  }, [currentUser]);

  // Add some console logs to help debug auth state
  useEffect(() => {
    console.log(
      "ProtectedRoute:", 
      location.pathname, 
      "- loading:", loading, 
      "- user:", currentUser ? "authenticated" : "null",
      "- role:", userRole || "none"
    );
  }, [currentUser, loading, location.pathname, userRole]);

  // Set up auth timeout
  useEffect(() => {
    let timeoutId: number | undefined;
    
    if (loading) {
      timeoutId = window.setTimeout(() => {
        setAuthTimeout(true);
      }, 3000);
    } else {
      setAuthTimeout(false);
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [loading]);

  const handleResetAuth = () => {
    clearAuthState();
    window.location.href = '/auth';
  };

  // Show auth timeout recovery UI if we're stuck in loading state
  if (authTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Taking Too Long</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
          The authentication system is taking longer than expected to respond.
        </p>
        
        <div className="flex gap-4">
          <Button 
            variant="outline"
            onClick={() => setAuthTimeout(false)}
            className="flex items-center"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Keep Waiting
          </Button>
          
          <Button 
            variant="destructive"
            onClick={handleResetAuth}
            className="flex items-center"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Reset & Login Again
          </Button>
        </div>
      </div>
    );
  }

  // While authentication status is being determined - with a shorter timeout
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Authenticating...</span>
        </div>
      </div>
    );
  }

  // If not authenticated
  if (!currentUser) {
    console.log("No authenticated user, redirecting to login");
    // Store the current path to redirect back after login
    const redirectPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(redirectPath)}`} replace />;
  }

  // If admin is required but user is not admin
  if (requireAdmin && !isAdmin) {
    toast.error("You don't have admin permissions to access this page");
    return <Navigate to="/" replace />;
  }

  // If specific roles are required but user doesn't have them
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole as AllowedRole)) {
    toast.error(`Access denied: ${userRole} role cannot access this page`);
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
