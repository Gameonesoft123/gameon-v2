import React, { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import FaceCapture from "@/components/customers/faceid/FaceCapture";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getStoreContext } from "@/utils/storeContext";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  phoneNumber: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  rating: z.string().optional(),
  notes: z.string().optional(),
  enableFaceId: z.boolean().default(true),
});

type CustomerFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  createCustomer?: (data: any) => Promise<{ success: boolean; error?: any }>;
};

export function CustomerForm({
  onSuccess,
  onCancel,
  createCustomer,
}: CustomerFormProps) {
  const [currentStep, setCurrentStep] = useState<"details" | "faceCapture">(
    "details"
  );
  const [faceId, setFaceId] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [hasStoreId, setHasStoreId] = useState<boolean | null>(null);

  // Generate a stable ID for the potential new customer for face registration
  const pendingCustomerIdForFaceReg = useMemo(
    () => crypto.randomUUID(),
    [currentStep]
  );

  useEffect(() => {
    setHasStoreId(!!currentUser?.store_id);
  }, [currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      rating: "3",
      notes: "",
      enableFaceId: true,
    },
  });

  const resetForm = () => {
    form.reset();
    setFaceId(null);
    setCurrentStep("details");
    form.clearErrors();
  };

  const handleFaceCapture = (imageDataUrl: string) => {
    // This onCapture is optional, mainly if parent needs raw image.
    // console.log('Face image captured for customer:', imageDataUrl.substring(0, 50) + '...');
  };

  const handleFaceDetected = async (detectedExternalImageId: string) => {
    // detectedExternalImageId is the customerIdForRegistration we sent to Rekognition
    if (!detectedExternalImageId) {
      toast.error("Failed to register face ID with Rekognition.");
      return;
    }

    if (detectedExternalImageId !== pendingCustomerIdForFaceReg) {
      toast.error("Face ID mismatch during registration. Please try again.");
      console.error(
        `Received ${detectedExternalImageId}, expected ${pendingCustomerIdForFaceReg}`
      );
      setCurrentStep("details"); // Go back to details, user might need to restart face capture
      return;
    }

    setFaceId(detectedExternalImageId); // Store the confirmed ID
    console.log("Face ID registered for customer:", detectedExternalImageId);
    toast.success("Face ID registered. Submitting customer details...");

    // Automatically submit the form with all data including the new faceId
    const formData = form.getValues();
    try {
      // Use the stored faceId (which is pendingCustomerIdForFaceReg)
      const customerPayload = {
        id: pendingCustomerIdForFaceReg,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phoneNumber,
        email: formData.email,
        rating: parseInt(formData.rating || "3"),
        notes: formData.notes,
        face_id: detectedExternalImageId, // Use the ID from Rekognition
      };

      if (createCustomer) {
        const result = await createCustomer(customerPayload);
        if (!result.success)
          throw new Error(
            result.error?.message || "Failed to create customer via prop."
          );
      } else {
        const { error } = await supabase
          .from("customers")
          .insert(customerPayload)
          .select();
        if (error) throw error;
      }

      toast.success("Customer created successfully with Face ID!");
      resetForm();
      if (onSuccess) onSuccess();
      setCurrentStep("details"); // Reset step
    } catch (error: any) {
      console.error("Error creating customer after face detection:", error);
      toast.error(
        `Failed to create customer: ${error.message || "Please try again."}`
      );
      // Optionally, allow user to retry form submission or clear faceId
      // setFaceId(null); // Clear faceId if submission failed
      // setCurrentStep('details');
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hasStoreId) {
      toast.error(
        "You don't have a store assigned. Please update your profile or contact support."
      );
      return;
    }

    if (values.enableFaceId && !faceId && currentStep === "details") {
      // Transition to face capture step.
      // pendingCustomerIdForFaceReg is already generated/updated by useMemo.
      setCurrentStep("faceCapture");
      return;
    }

    // This part handles submission if Face ID was skipped, or if faceId is already set (e.g. editing - though this form is create only)
    // Or if user skipped face ID after enabling it and returning to details.
    try {
      const customerPayload = {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phoneNumber,
        email: values.email,
        rating: parseInt(values.rating || "3"),
        notes: values.notes,
        face_id: values.enableFaceId ? faceId : null, // Use already registered faceId if available and enabled
      };

      if (createCustomer) {
        const result = await createCustomer(customerPayload);
        if (!result.success)
          throw new Error(
            result.error?.message || "Failed to create customer via prop."
          );
      } else {
        const { error } = await supabase
          .from("customers")
          .insert(customerPayload)
          .select();
        if (error) throw error;
      }

      toast.success(
        values.enableFaceId && faceId
          ? "Customer created successfully with Face ID!"
          : "Customer created successfully!"
      );
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast.error(
        `Failed to create customer: ${error.message || "Please try again."}`
      );
    }
  }

  const handleCancel = () => {
    if (currentStep === "faceCapture") {
      setCurrentStep("details");
      // Optionally clear faceId if user cancels from face capture
      // setFaceId(null);
      // form.setValue('enableFaceId', false); // Or keep it enabled as per user's last choice
    } else if (onCancel) {
      resetForm(); // Also reset form on main cancel
      onCancel();
    }
  };

  if (hasStoreId === false) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Store Not Assigned</AlertTitle>
        <AlertDescription>
          Your user account doesn't have a store assigned. Please update your
          profile with a store or contact support to add customers.
        </AlertDescription>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/profile")}
          >
            Go to Profile
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === "faceCapture" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Face ID Registration for {form.getValues("firstName")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please ask the customer to look at the camera to register their
              Face ID.
            </p>
            <FaceCapture
              mode="register"
              // onCapture={handleFaceCapture} // Optional
              onFaceDetected={handleFaceDetected}
              customerIdForRegistration={pendingCustomerIdForFaceReg} // Pass the generated ID
            />
            <div className="flex justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentStep("details"); // Go back to details
                }}
              >
                Back to Details
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setValue("enableFaceId", false);
                  setCurrentStep("details");
                  // Manually trigger form submission without Face ID
                  onSubmit(form.getValues());
                }}
              >
                Skip Face ID & Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            {faceId && (
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-900 mb-4">
                <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                  Face ID ({faceId.substring(0, 10)}...) registered. Complete
                  the form to save.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Rating</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 Star - Poor</SelectItem>
                      <SelectItem value="2">2 Stars - Fair</SelectItem>
                      <SelectItem value="3">3 Stars - Good</SelectItem>
                      <SelectItem value="4">4 Stars - Very Good</SelectItem>
                      <SelectItem value="5">5 Stars - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Rate this customer based on their behavior and spending.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this customer here..."
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableFaceId"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Face ID</FormLabel>
                    <FormDescription>
                      Register customer's face for faster future identification
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          setFaceId(null); // Clear faceId if user disables it
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
              )}
              <div className="w-full sm:w-auto order-1 sm:order-2">
                <Button type="submit" className="w-full">
                  {form.getValues("enableFaceId") && !faceId
                    ? "Continue to Face ID"
                    : "Save Customer"}
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </Form>
  );
}

export default CustomerForm;
