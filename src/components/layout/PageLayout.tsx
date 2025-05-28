
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { clearAuthState, resetRedirectCounter } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, loading, currentUser } = useAuth();
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Add an effect to handle authentication redirects
  useEffect(() => {
    // Clear any redirect counters when successfully on a protected page
    resetRedirectCounter();
    
    // Only schedule timeout if still loading
    let authTimeoutId: number | undefined;
    
    if (loading) {
      authTimeoutId = window.setTimeout(() => {
        console.log("Authentication timeout - showing recovery options");
        setAuthTimedOut(true);
      }, 3000); // Allow 3 seconds for auth to complete
    }
    
    // If not loading and no user, redirect to auth
    if (!loading && !currentUser && !user) {
      console.log("No authenticated user in PageLayout, redirecting to auth");
      navigate('/auth', { replace: true });
    }
    
    return () => {
      if (authTimeoutId) {
        window.clearTimeout(authTimeoutId);
      }
    };
  }, [loading, currentUser, user, navigate]);

  const handleResetAuth = () => {
    clearAuthState();
    window.location.href = '/auth';
  };

  const handleKeepWaiting = () => {
    setAuthTimedOut(false);
    // Reset the timeout
    setTimeout(() => {
      if (loading) {
        setAuthTimedOut(true);
      }
    }, 5000);
  };

  // Show authentication recovery UI if we're stuck in loading state
  if (authTimedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Taking Too Long</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">
          The authentication system is taking longer than expected to respond.
        </p>
        
        <div className="flex gap-4">
          <Button 
            variant="outline"
            onClick={handleKeepWaiting}
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

  // Show regular loading state
  if (loading || (!user && !currentUser)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground mb-8">Loading application...</p>
        
        {loadingError && (
          <div className="max-w-md p-4 bg-destructive/10 border border-destructive/30 rounded-md mt-4 flex flex-col items-center">
            <AlertCircle className="h-5 w-5 text-destructive mb-2" />
            <p className="text-sm text-destructive mb-3">{loadingError}</p>
            <button 
              onClick={() => navigate('/auth', { replace: true })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
      />
      <div className={cn(
        "flex flex-col flex-1 w-0 overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "pl-16" : "pl-64"
      )}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
