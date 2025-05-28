import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, UserPlus, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import FaceCapture from '@/components/auth/FaceCapture';

export function SignUpForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeError, setStoreError] = useState(false);
  const [registeredFaceId, setRegisteredFaceId] = useState<string | null>(null);
  const [isFaceRegistrationEnabled, setIsFaceRegistrationEnabled] = useState(false);

  // Generate a stable ID for face registration process for this sign-up attempt
  const pendingExternalImageId = useMemo(() => crypto.randomUUID(), []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreError(false);
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!storeName) {
      toast.error('Please enter a store name');
      return;
    }
    
    if (isFaceRegistrationEnabled && !registeredFaceId) {
      toast.error('Face ID registration is enabled but not yet completed. Please wait for face capture or disable it.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            store_name: storeName,
            role: 'owner', // Default role
            company: storeName // Store company name if applicable
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      const userId = signUpData?.user?.id;

      if (!userId) {
        throw new Error("User registration failed, user ID not found.");
      }

      // Step 2: Create store (existing logic)
      if (signUpData?.user) {
        // ... keep existing code (store creation logic)
        try {
          console.log("Creating store for new user using edge function");
          
          // Make sure we have a session token
          if (!signUpData.session?.access_token) {
            console.error("No access token available for store creation");
            setStoreError(true);
            toast.warning("Account created but missing authentication token for store setup. Please log in and set up your store later.");
            // Navigate to verify email, as user is created
            navigate('/auth/verify-email', { replace: true });
            setLoading(false); // Ensure loading is stopped
            return;
          }
          
          // Call the edge function to create store and link to user
          const response = await fetch(`https://wgqvihhdxutfjuptnyrg.supabase.co/functions/v1/create-user-store`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${signUpData.session.access_token}`,
            },
            body: JSON.stringify({
              user_id: signUpData.user.id,
              store_name: storeName
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Store creation failed with status: ${response.status}`, errorText);
            setStoreError(true);
            toast.warning("Account created but store setup failed. You can set up your store later in your profile.");
          } else {
            const result = await response.json();
            console.log("Store creation result:", result);
            
            if (result.success && result.store_id) {
              console.log("Store created successfully:", result.store_id);
              toast.success("Store setup complete!");
            } else {
              console.warn("Store creation response didn't contain store_id:", result);
              setStoreError(true);
              toast.warning("Account created but store setup is incomplete. Please update your profile later.");
            }
          }
        } catch (storeCreationError: any) {
          console.error("Error setting up store:", storeCreationError);
          setStoreError(true);
          toast.warning("Account created but store setup encountered an error. You can set up your store later in your profile.");
        }
      }

      // Step 3: If a face ID was registered via FaceCapture, link it to the user
      if (registeredFaceId && userId) {
        console.log(`Linking face ID ${registeredFaceId} (which should be ${pendingExternalImageId}) to user ${userId}`);
        const { error: faceLinkError } = await supabase
          .from('auth_user_face_logins')
          .insert({
            user_id: userId,
            external_image_id: registeredFaceId 
          });

        if (faceLinkError) {
          console.error('Error linking face ID to user:', faceLinkError);
          toast.error('Account created, but failed to save Face ID. You can try setting it up later.');
        } else {
          console.log('Face ID linked successfully.');
          toast.success('Face ID registered and linked to your account!');
        }
      }
      
      console.log("User registered successfully");
      toast.success('Signup successful! Please check your email to verify your account.');
      navigate('/auth/verify-email', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFaceDetectedForSignUp = (faceIdFromRekognition: string) => {
    // faceIdFromRekognition is the ExternalImageId we sent (pendingExternalImageId)
    if (faceIdFromRekognition === pendingExternalImageId) {
      setRegisteredFaceId(faceIdFromRekognition); 
      toast.success(`Face data captured: ${faceIdFromRekognition.substring(0, 15)}... Ready for signup.`);
    } else {
      console.warn(`Received faceId ${faceIdFromRekognition} does not match pending ${pendingExternalImageId}`);
      toast.error('Face ID mismatch during registration. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="signup-email" 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="store-name">Store Name <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="store-name" 
              type="text" 
              placeholder="Enter your store name" 
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="signup-password" 
              type="password" 
              placeholder="Create a password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="confirm-password" 
              type="password" 
              placeholder="Confirm your password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        {storeError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">
              Note: There was an issue setting up your store. You can complete this later in your profile settings.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
          <UserPlus className="ml-2 h-4 w-4" />
        </Button>
        
        <Separator>
          <span className="mx-2 mb-2 text-xs text-muted-foreground">OR REGISTER WITH FACE ID</span>
        </Separator>
        
        <div className="w-full mt-1">
           <Label 
            htmlFor="enable-face-reg" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center cursor-pointer"
          >
            <Input 
              type="checkbox"
              id="enable-face-reg"
              checked={isFaceRegistrationEnabled}
              onChange={(e) => setIsFaceRegistrationEnabled(e.target.checked)}
              className="mr-2 h-4 w-4"
            />
            Enable Face ID Registration
          </Label>
          {isFaceRegistrationEnabled && (
            <div className="mt-2 p-2 border rounded-md">
              <p className="text-xs text-muted-foreground mb-2">
                After enabling, look at the camera. Your face data will be captured. Then click "Create Account".
              </p>
              <FaceCapture 
                mode="register"
                onFaceDetected={handleFaceDetectedForSignUp}
                externalImageIdForRegistration={pendingExternalImageId} // Pass the generated ID
              />
              {registeredFaceId && (
                <p className="text-xs text-green-600 mt-1">Face data captured ({registeredFaceId.substring(0,10)}...). Ready to link on account creation.</p>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </form>
  );
}
