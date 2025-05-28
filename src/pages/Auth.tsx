
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, clearAuthState, getAuthStateFromStorage, preventRedirectLoop, resetRedirectCounter } from "@/integrations/supabase/client";
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/auth';

const Auth = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'login');
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const returnTo = searchParams.get('returnTo') || '/';
  
  useEffect(() => {
    // Store the returnTo URL for redirect after login
    localStorage.setItem('auth_return_url', returnTo || '/');
    
    // Reset redirect counter to avoid false positives
    resetRedirectCounter();
    
    // Log authentication status for debugging
    console.log("Auth component - currentUser:", currentUser ? "exists" : "null", "authLoading:", authLoading);
    
    // Check if we're in a redirect loop and should show an error
    const isInRedirectLoop = preventRedirectLoop();
    if (isInRedirectLoop) {
      console.error("Redirect loop detected!");
      setError("Too many redirects detected. Please try clearing your browser cookies or resetting your authentication state.");
      setChecking(false);
      return;
    }
    
    // If we have a current user in context, redirect directly
    if (currentUser && !authLoading) {
      // Special case for admin users
      if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
        console.log("Admin user authenticated, redirecting to admin dashboard");
        navigate('/admin-dashboard', { replace: true });
        return;
      }
      
      console.log("User already authenticated, redirecting to:", returnTo);
      // Use timeout to ensure state updates complete first
      setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 100);
      return;
    }

    // Always set checking to false after a short timeout
    // This ensures users aren't stuck on the loading screen
    const timer = setTimeout(() => {
      if (checking) {
        console.log("Auth check timeout - forcing completion");
        setChecking(false);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [returnTo, navigate, currentUser, authLoading]);

  const handleReset = () => {
    clearAuthState();
    setError(null);
    sessionStorage.removeItem('auth_redirects');
    window.location.reload();
  };

  if (authLoading && checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-game-primary/10 to-game-secondary/10 p-4">
        <div className="w-full max-w-md flex flex-col items-center">
          <AuthHeader />
          <div className="w-full flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Verifying authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-game-primary/10 to-game-secondary/10 p-4">
      <div className="w-full max-w-md">
        <AuthHeader />
        
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
            <p>{error}</p>
            <Button 
              className="mt-2 w-full"
              onClick={handleReset}
              variant="destructive"
            >
              Reset Authentication & Try Again
            </Button>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? 'Sign in to your account to continue' 
                : 'Create a new account to get started'}
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm returnTo={returnTo} />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
