
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (type !== 'signup' || !token) {
        setVerifying(false);
        return;
      }
      
      try {
        // For our demo, we'll simulate email verification
        // In a real app, Supabase would handle this automatically
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setVerified(true);
        toast.success('Email verified successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to verify email');
        console.error('Verification error:', error);
      } finally {
        setVerifying(false);
      }
    };
    
    verifyEmail();
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-game-primary/10 to-game-secondary/10 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              Verifying your email address
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center pt-4">
            {verifying ? (
              <>
                <Loader2 className="h-16 w-16 text-game-primary animate-spin mb-4" />
                <p>Please wait while we verify your email address...</p>
              </>
            ) : verified ? (
              <>
                <div className="bg-green-100 rounded-full p-4 mb-4">
                  <Check className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email Verified!</h3>
                <p className="text-center text-muted-foreground mb-4">
                  Your email has been successfully verified. You can now use all features of the application.
                </p>
              </>
            ) : (
              <>
                <div className="bg-amber-100 rounded-full p-4 mb-4">
                  <Mail className="h-16 w-16 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Verification Failed</h3>
                <p className="text-center text-muted-foreground mb-4">
                  We couldn't verify your email address. The verification link may be expired or invalid.
                </p>
              </>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate(verified ? '/' : '/auth')}
            >
              {verified ? 'Go to Dashboard' : 'Back to Login'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
