import React, { useState, useEffect } from "react";
import { CheckIcon, Loader2, AlertCircle } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SubscriptionFeatures = [
  "Unlimited machines management",
  "Unlimited cash tracking history",
  "Advanced reporting and analytics",
  "Facial recognition for staff and customers",
  "Backup ID card management",
  "Security features and notifications",
  "User role management",
  "Marketing campaign tools",
  "Bonus and loyalty program",
  "Premium support",
];

const Subscription: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query parameters for success/canceled messages
  const queryParams = new URLSearchParams(location.search);
  const isSuccess = queryParams.get("success") === "true";
  const isCanceled = queryParams.get("canceled") === "true";

  useEffect(() => {
    if (isSuccess) {
      toast.success("Subscription successful! Your plan is now active.");
      // Clear query parameters after showing toast, without redirecting away
      navigate("/subscription", { replace: true });
    } else if (isCanceled) {
      toast.error("Subscription process was canceled.");
      // Clear query parameters after showing toast, without redirecting away
      navigate("/subscription", { replace: true });
    }
  }, [isSuccess, isCanceled, navigate]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchSubscriptionData();

      // Set up real-time subscription to user_subscriptions table
      const channel = supabase
        .channel("user_subscriptions_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_subscriptions",
            filter: `user_id=eq.${currentUser.id}`,
          },
          () => {
            console.log("Subscription data updated, refreshing");
            fetchSubscriptionData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setIsLoadingSub(false);
    }
  }, [currentUser?.id]);

  const fetchSubscriptionData = async () => {
    if (!currentUser?.id) return;

    setIsLoadingSub(true);
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching subscription data:", error);
        toast.error("Failed to load subscription data");
        return;
      }

      setSubscriptionData(data || null);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setIsLoadingSub(false);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser?.id) {
      toast.error("You must be logged in to subscribe");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            returnUrl: window.location.origin + "/subscription",
            planId: "premium",
          },
        }
      );

      if (error) {
        console.error("Error creating checkout session:", error);
        throw new Error(`Error: ${error.message}`);
      }

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(
          "Failed to initialize payment process: No checkout URL returned"
        );
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast.error(
        `Failed to initialize payment process: ${
          error.message || "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <PageLayout title="Subscription Plan">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage your GameOn subscription and billing details
        </p>

        {isSuccess && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Activated</AlertTitle>
            <AlertDescription>
              Thank you for subscribing! Your premium features are now active.
            </AlertDescription>
          </Alert>
        )}

        {isCanceled && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Canceled</AlertTitle>
            <AlertDescription>
              The subscription process was canceled. If you experienced any
              issues, please try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center py-8">
          <Card className="w-full max-w-md border-game-primary/30">
            <CardHeader className="bg-game-primary/5 border-b border-game-primary/20">
              <CardTitle className="text-2xl text-center">
                Premium Plan
              </CardTitle>
              <CardDescription className="text-center text-lg">
                $300<span className="text-sm">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {SubscriptionFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 h-5 w-5 rounded-full bg-game-primary flex items-center justify-center shrink-0">
                      <CheckIcon className="h-3.5 w-3.5 text-white" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSubscribe}
                className="w-full bg-game-primary hover:bg-game-primary/90"
                disabled={isLoading || subscriptionData?.status === "active"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : subscriptionData?.status === "active" ? (
                  "Currently Subscribed"
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {isLoadingSub ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptionData ? (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-xl font-semibold mb-4">Subscription Details</h3>
            <dl className="space-y-4">
              <div className="grid grid-cols-3 items-center border-b pb-3">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="col-span-2 font-medium">Premium</dd>
              </div>
              <div className="grid grid-cols-3 items-center border-b pb-3">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="col-span-2 font-medium">$300.00 / month</dd>
              </div>
              <div className="grid grid-cols-3 items-center border-b pb-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="col-span-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscriptionData.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {subscriptionData.status === "active"
                      ? "Active"
                      : subscriptionData.status}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-3 items-center border-b pb-3">
                <dt className="text-muted-foreground">Billing Cycle</dt>
                <dd className="col-span-2 font-medium">Monthly</dd>
              </div>
              <div className="grid grid-cols-3 items-center border-b pb-3">
                <dt className="text-muted-foreground">Next Payment</dt>
                <dd className="col-span-2 font-medium">
                  {formatDate(subscriptionData.end_date)}
                </dd>
              </div>
              <div className="grid grid-cols-3 items-center">
                <dt className="text-muted-foreground">Payment Method</dt>
                <dd className="col-span-2 font-medium">Visa ending in 4242</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">
              No Active Subscription
            </h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to the Premium plan to access all features and benefits.
            </p>
            <Button
              onClick={handleSubscribe}
              className="bg-game-primary hover:bg-game-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Subscription;
