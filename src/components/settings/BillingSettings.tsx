import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Loader2,
  Calendar,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BillingSettingsProps {
  onSave: () => void;
}

const BillingSettings: React.FC<BillingSettingsProps> = ({ onSave }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);

  // Fetch subscription data
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

  useEffect(() => {
    fetchSubscriptionData();

    // Set up real-time subscription to user_subscriptions table
    if (currentUser?.id) {
      const channel = supabase
        .channel("billing_subscription_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_subscriptions",
            filter: `user_id=eq.${currentUser.id}`,
          },
          () => {
            console.log("Subscription data updated in billing, refreshing");
            fetchSubscriptionData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id]);

  const handleManageSubscription = async () => {
    if (!currentUser?.id) {
      toast.error("You must be logged in to manage your subscription");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            returnUrl: window.location.origin + "/settings",
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

  // Format the date to a readable string
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
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Subscription Plan</h3>
          <Button onClick={handleManageSubscription} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {subscriptionData ? "Manage Subscription" : "Subscribe Now"}
              </>
            )}
          </Button>
        </div>

        {isLoadingSub ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptionData ? (
          <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
            <div>
              <p className="font-medium">Premium Plan</p>
              <p className="text-sm text-muted-foreground">$300 per month</p>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                subscriptionData.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {subscriptionData.status === "active"
                ? "Active"
                : subscriptionData.status}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
            <div>
              <p className="font-medium">No Active Subscription</p>
              <p className="text-sm text-muted-foreground">
                Subscribe to access premium features
              </p>
            </div>
            <Link to="/subscription">
              <Button size="sm">View Plans</Button>
            </Link>
          </div>
        )}

        {subscriptionData && (
          <>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  Subscription Period
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSubscriptionData}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Start Date:
                  </span>
                  <span>{formatDate(subscriptionData.start_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Next Billing Date:
                  </span>
                  <span>{formatDate(subscriptionData.end_date)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="font-medium flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                Payment Method
              </h4>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-16 bg-muted rounded-md flex items-center justify-center text-xs font-medium">
                    VISA
                  </div>
                  <div>
                    <p>Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">
                      Expires 04/2028
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                >
                  Edit
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                Payment History
              </h4>
              <div className="space-y-1 p-4 rounded-lg border">
                <div className="flex justify-between items-center py-2 border-b">
                  <span>April 9, 2025</span>
                  <span className="font-medium">$300.00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>March 9, 2025</span>
                  <span className="font-medium">$300.00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>February 9, 2025</span>
                  <span className="font-medium">$300.00</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  View All Transactions
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default BillingSettings;
