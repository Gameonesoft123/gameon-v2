import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Plus,
  Edit,
  RefreshCw,
  Check,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminSubscriptions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subPlans, setSubPlans] = useState([]);

  const fetchPlans = async () => {
    let { data: subscription_plans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*");
    if (plansError) {
      setSubPlans([]);
      return;
    }

    setSubPlans(subscription_plans || []);
  };

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch subscriptions data from user_subscriptions table
      const { data: subscriptionsData, error: subscriptionsError } =
        await supabase
          .from("user_subscriptions")
          .select("*")
          .order("created_at", { ascending: false });

      if (subscriptionsError) {
        console.error("Error fetching subscriptions:", subscriptionsError);
        setError("Failed to load subscription data");
        return;
      }

      if (!subscriptionsData || subscriptionsData.length === 0) {
        console.log("No subscriptions found");
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }

      // Get user data for each subscription
      const subsWithUserData = await Promise.all(
        subscriptionsData.map(async (sub) => {
          // Get user data
          let userData = null;

          try {
            // If you have proper admin permissions, you can use this
            // const { data, error } = await supabase.auth.admin.getUserById(sub.user_id);
            // If not, we'll try to get user data from a profiles table or similar
            const { data, error } = await supabase.auth.admin.getUserById(
              sub.user_id
            );

            if (!error && data) {
              userData = data.user;
            } else {
              console.error("Error fetching user data:", error);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }

          // Determine plan name based on ID or default to "Premium"
          let planName = "Premium";
          if (sub.plan_id === "basic") planName = "Basic";
          if (sub.plan_id === "enterprise") planName = "Enterprise";

          return {
            ...sub,
            company: userData?.user_metadata?.store_name || "Unknown Store",
            email: userData?.email || "Unknown Email",
            billingCycle: "Monthly", // Assuming monthly by default
            amount:
              sub.plan_id === "basic"
                ? "$199"
                : sub.plan_id === "enterprise"
                ? "$999"
                : "$399",
            planName: planName,
          };
        })
      );

      setSubscriptions(subsWithUserData);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setError("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Function to convert keys to Title Case
  function toTitleCase(key: string): string {
    if (key === "247_support") return "24/7 Support";
    return key
      .replace(/[_-]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const handleAddSubscription = () => {
    toast.info("Add subscription functionality will be implemented soon");
  };

  const handleExportSubscriptions = () => {
    toast.info("Export functionality will be implemented soon");
  };

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      (sub.company?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (sub.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="inline-block h-3 w-3 mr-1" />
            Active
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="inline-block h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      case "incomplete":
      case "incomplete_expired":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Incomplete
          </span>
        );
      case "trialing":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Trial
          </span>
        );
      case "past_due":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Past Due
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || "Unknown"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subPlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                {plan.name}
                <Button size="icon" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                <div className="font-medium text-xl mt-2">
                  {plan.price ? `$${plan.price}` : "-"}
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <div>
                  {plan.price ? `$${plan.price * 12}` : "-"}
                  <span className="text-sm text-muted-foreground">/year</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(Object.keys(plan.features).map(toTitleCase) || []).map(
                  (feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-game-primary"></div>
                      {feature}
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Current Subscriptions</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSubscriptions}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchSubscriptions} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleAddSubscription}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No subscriptions found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.company || "Unknown"}
                    </TableCell>
                    <TableCell>{sub.email || "Unknown"}</TableCell>
                    <TableCell>{sub.planName || "Premium"}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>{sub.billingCycle || "Monthly"}</TableCell>
                    <TableCell>{formatDate(sub.end_date)}</TableCell>
                    <TableCell>{sub.amount || "$399"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;
