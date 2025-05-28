import React, { useState, useEffect } from "react";
import {
  User,
  UserCog,
  Camera,
  Mail,
  Phone,
  Building,
  MapPin,
  Store,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import FaceCapture from "@/components/auth/FaceCapture";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import {
  supabase,
  createStoreWithServiceRole,
  updateUserProfileStoreId,
} from "@/integrations/supabase/client";

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bio: string;
  store_name: string;
}

const Profile: React.FC = () => {
  const { currentUser, updateUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    bio: "",
    store_name: "",
  });

  useEffect(() => {
    if (currentUser) {
      console.log("Setting form state with currentUser:", currentUser);
      setFormState((prev) => ({
        ...prev,
        name:
          currentUser.user_metadata?.name ||
          `${currentUser.user_metadata?.first_name || ""} ${
            currentUser.user_metadata?.last_name || ""
          }`.trim() ||
          "User",
        email: currentUser.email || "",
        phone: currentUser.user_metadata?.phone || "",
        company:
          currentUser.user_metadata?.company || currentUser.store_name || "",
        address: currentUser.user_metadata?.address || "",
        city: currentUser.user_metadata?.city || "",
        state: currentUser.user_metadata?.state || "",
        zip: currentUser.user_metadata?.zip || "",
        bio: currentUser.user_metadata?.bio || "",
        store_name:
          currentUser.store_name || currentUser.user_metadata?.company || "",
      }));

      setStoreId(currentUser.store_id || null);

      if (currentUser.store_id && !currentUser.store_name) {
        fetchStoreName(currentUser.store_id);
      }
    }
  }, [currentUser]);

  const fetchStoreName = async (storeId: string) => {
    if (!storeId) return;

    try {
      console.log("Fetching store name for ID:", storeId);
      const { data, error } = await supabase
        .from("stores")
        .select("name")
        .eq("id", storeId)
        .single();

      if (error) {
        console.error("Error fetching store name:", error);
        throw error;
      }

      if (data && data.name) {
        console.log("Fetched store name:", data.name);
        setFormState((prev) => ({
          ...prev,
          store_name: data.name,
          company: data.name,
        }));
      }
    } catch (error: any) {
      console.error("Error fetching store name:", error);
      toast.error("Failed to fetch store name: " + error.message);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "store_name" ? { company: value } : {}),
      ...(name === "company" ? { store_name: value } : {}),
    }));
  };

  const createOrUpdateStore = async (
    storeName: string
  ): Promise<string | null> => {
    setErrorMessage(null);
    try {
      setIsCreatingStore(true);
      console.log("Creating/updating store with name:", storeName);

      // First attempt: Try direct insert with RLS
      try {
        console.log("Attempting direct store creation...");
        const { data, error } = await supabase
          .from("stores")
          .insert({ name: storeName })
          .select("id")
          .single();

        if (!error && data?.id) {
          console.log("Store created successfully via direct insert:", data.id);
          setStoreId(data.id);
          return data.id;
        } else {
          console.warn("Direct store creation failed:", error?.message);
          // Continue to fallback method
        }
      } catch (directError) {
        console.warn("Direct store creation threw exception:", directError);
        // Continue to fallback method
      }

      // Fallback: Try using service role function
      console.log("Falling back to service role store creation...");
      const {
        success,
        storeId: newStoreId,
        error,
      } = await createStoreWithServiceRole(storeName);

      if (!success || !newStoreId) {
        throw new Error(error || "Failed to create store");
      }

      console.log("Created new store with ID:", newStoreId);
      setStoreId(newStoreId);
      return newStoreId;
    } catch (error: any) {
      console.error("Error creating/updating store:", error);
      setErrorMessage(`Failed to create store: ${error.message}`);
      toast.error("Failed to create/update store: " + error.message);
      return null;
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log("Saving profile with store name:", formState.store_name);

      if (!formState.store_name) {
        toast.error("Store name is required");
        setIsLoading(false);
        return;
      }

      // First, create or update the store
      const updatedStoreId = await createOrUpdateStore(formState.store_name);
      if (!updatedStoreId) {
        toast.error("Failed to create/update store");
        setIsLoading(false);
        return;
      }

      // Then update the profile with the store ID
      if (updatedStoreId && currentUser) {
        console.log("Updating profile store_id:", updatedStoreId);
        const result = await updateUserProfileStoreId(
          currentUser.id,
          updatedStoreId
        );
        if (!result.success) {
          console.error("Error updating profile store_id:", result.error);
          setErrorMessage(`Failed to update profile: ${result.error}`);
          toast.error("Error updating profile: " + result.error);
          setIsLoading(false);
          return;
        }
      }

      // Finally update the user metadata
      const updates = {
        data: {
          name: formState.name,
          phone: formState.phone,
          company: formState.store_name,
          address: formState.address,
          city: formState.city,
          state: formState.state,
          zip: formState.zip,
          bio: formState.bio,
          store_name: formState.store_name,
          store_id: updatedStoreId,
        },
      };

      const updateResult = await updateUser(updates);
      if (!updateResult.success) {
        setErrorMessage(`Failed to update profile: ${updateResult.error}`);
        toast.error("Failed to update profile: " + updateResult.error);
        setIsLoading(false);
        return;
      }

      console.log(
        "Profile updated successfully with store ID:",
        updatedStoreId
      );
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);

      // Force refresh auth context
      if (refreshUser) {
        const updatedUser = await refreshUser();
        console.log("Refreshed user data:", updatedUser);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setErrorMessage(`Failed to update profile: ${error.message}`);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceCapture = (imageDataUrl: string) => {
    console.log("Face captured:", imageDataUrl);
  };

  const handleFaceDetected = (faceId: string) => {
    console.log("Face ID detected:", faceId);
    toast.success("Face ID updated successfully");
    setIsCapturingFace(false);
  };

  return (
    <PageLayout title="Profile">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage your personal information and settings
        </p>

        {!storeId && !isEditingProfile && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Store Setup Required</AlertTitle>
            <AlertDescription>
              You need to set up a store before you can use most features of the
              application. Please click "Edit Profile" and enter a store name.
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="face-id">
              <Camera className="mr-2 h-4 w-4" />
              Face ID
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg" alt="Profile picture" />
                  <AvatarFallback>
                    {currentUser?.email?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-semibold">{formState.name}</h3>
                  <p className="text-muted-foreground">{formState.email}</p>
                  {formState.store_name && (
                    <p className="text-sm font-medium text-primary">
                      {formState.store_name}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant={isEditingProfile ? "outline" : "default"}
                onClick={() =>
                  isEditingProfile
                    ? handleSaveProfile()
                    : setIsEditingProfile(true)
                }
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : isEditingProfile
                  ? "Save Changes"
                  : "Edit Profile"}
              </Button>
            </div>

            <div className="space-y-4">
              {isEditingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_name" className="flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      Store/Company Name
                      <span className="text-xs text-muted-foreground ml-2">
                        (Required)
                      </span>
                    </Label>
                    <Input
                      id="store_name"
                      name="store_name"
                      value={formState.store_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formState.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formState.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formState.city}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formState.state}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          name="zip"
                          value={formState.zip}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formState.bio}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{formState.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Store/Company
                        </p>
                        <p>{formState.store_name || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p>{formState.phone || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p>{formState.company}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Location
                        </p>
                        <p>
                          {formState.city || "City"},{" "}
                          {formState.state || "State"} {formState.zip || "Zip"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Bio</p>
                    <p>{formState.bio || "No bio available"}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="face-id" className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                Face ID Authentication
              </h3>
              <p className="text-muted-foreground mb-6">
                Use facial recognition to securely log in to the application
                without having to enter your password. Your facial data is
                encrypted and stored securely.
              </p>

              {isCapturingFace ? (
                <div className="space-y-4">
                  <FaceCapture
                    mode="register"
                    onCapture={handleFaceCapture}
                    onFaceDetected={handleFaceDetected}
                    externalImageIdForRegistration={currentUser.id}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsCapturingFace(false)}
                    className="mt-4"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Face ID is enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Last updated: April 2, 2025
                    </p>
                  </div>
                  <Button onClick={() => setIsCapturingFace(true)}>
                    <Camera className="mr-2 h-4 w-4" />
                    Update Face ID
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                Security Information
              </h3>
              <p className="text-muted-foreground mb-2">
                Your facial recognition data is processed using Azure Face API
                and stored securely in your account. We never share this data
                with third parties.
              </p>
              <p className="text-muted-foreground">
                For optimal face recognition, ensure good lighting and look
                directly at the camera when capturing or authenticating.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Profile;
