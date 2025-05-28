
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, AlertTriangle } from 'lucide-react'; // Removed UserCheck
// Assuming a Google icon might be nice, let's import a generic one or use text
// For simplicity, I'll use text first. If you have a specific Google icon component, let me know.
import { useAuth } from '@/contexts/auth';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resetRedirectCounter } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
// FaceCapture import is no longer needed
// import FaceCapture from '@/components/auth/FaceCapture'; 

interface LoginFormProps {
  returnTo: string;
}

export function LoginForm({ returnTo }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Removed faceLoginLoading state
  const [loginError, setLoginError] = useState<string | null>(null);
  const { signIn, staffLogin, signInWithOAuth } = useAuth(); // Removed signInWithFaceId, added signInWithOAuth
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting login with:", email);
      const redirectUrl = returnTo || '/';
      localStorage.setItem('auth_return_url', redirectUrl);
      resetRedirectCounter();

      let result;
      if (email === 'admin@gameon.com' && staffLogin) {
        console.log("Attempting admin login");
        result = await staffLogin(email, password);
        if (result.success) {
          toast.success('Logged in successfully as admin');
          setTimeout(() => navigate('/admin-dashboard', { replace: true }), 100);
          setLoading(false);
          return;
        }
        console.log("Admin login failed, trying standard/staff login:", result.error);
      }
      
      result = await signIn(email, password);

      if (result.success) {
        toast.success('Logged in successfully');
        console.log("Login successful, navigating to:", redirectUrl);
        setTimeout(() => navigate(redirectUrl, { replace: true }), 100);
      } else if (staffLogin) { 
        console.log("Standard login failed, trying staff login as fallback for:", email);
        result = await staffLogin(email, password);
        if (result.success) {
          toast.success('Logged in successfully as staff');
          console.log("Staff login successful, navigating to:", redirectUrl);
          setTimeout(() => navigate(redirectUrl, { replace: true }), 100);
        } else {
          throw new Error(result.error || 'Invalid credentials or staff login failed.');
        }
      } else {
        throw new Error(result.error || 'Invalid credentials.');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Failed to log in. Please check your credentials.';
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Removed handleFaceLoginAttempt function

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setLoading(true); // Use general loading state
    try {
      const { error } = await signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Or your specific callback URL
        },
      });
      if (error) {
        throw error;
      }
      // Supabase handles the redirect, so no explicit navigation here after success
      // Toast for initiation might be good, but actual success comes after redirect
      toast.info("Redirecting to Google for sign-in...");
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      const errorMessage = error.message || 'Failed to initiate Google Sign-In.';
      setLoginError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
    // setLoading(false) might not be reached if redirect happens.
    // If there's an error before redirect, it will be set to false.
  };


  return (
    <form onSubmit={handleLogin}>
      <CardContent className="space-y-4 pt-4">
        {loginError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{loginError}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="button" 
            variant="link" 
            className="text-sm text-game-primary hover:underline px-0"
            onClick={() => navigate('/auth/reset-password')}
            disabled={loading}
          >
            Forgot password?
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In with Email'}
          <LogIn className="ml-2 h-4 w-4" />
        </Button>
        
        <div className="relative w-full">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
        </div>
        
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {/* You can add a Google icon here if you have one */}
          {/* <GoogleIcon className="mr-2 h-4 w-4" /> */}
          Sign In with Google
        </Button>

        {/* Removed FaceCapture integration */}
      </CardFooter>
    </form>
  );
}
