import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Search, UserRound, X, LogIn } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import CustomerDialog from "@/components/customers/CustomerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import FaceCapture from "@/components/auth/FaceCapture";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  rating: number;
  face_id: string | null;
  notes?: string;
  created_at: string;
  store_id: string;
  is_checked_in?: boolean;
  check_in_id?: string;
}

// First, let's define an interface for the customer_face_ids table structure
interface CustomerFaceId {
  id: number; // bigint in DB = number in TS
  created_at: string;
  customer_id: string | null; // uuid in DB = string in TS
  face_id: string | null;
  face_data: unknown | null; // jsonb in DB = any in TS
  store_id: string | null; // uuid in DB = string in TS
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFaceSearchActive, setIsFaceSearchActive] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const { currentUser } = useAuth();

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      if (
        !currentUser?.store_id ||
        currentUser.store_id === "00000000-0000-0000-0000-000000000000"
      ) {
        console.error("No valid store_id found for current user");
        toast.error("Store ID not found. Please update your profile first.");
        setLoading(false);
        return;
      }

      // Let RLS handle the filtering based on store_id
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }

      // Get all active check-ins
      const { data: checkIns, error: checkInsError } = await supabase
        .from("customer_check_ins")
        .select("id, customer_id")
        .is("check_out_time", null);

      if (checkInsError) {
        console.error("Error fetching check-ins:", checkInsError);
        throw checkInsError;
      }

      // Create a map of customer_id to check_in_id
      const checkedInCustomers = new Map();
      checkIns?.forEach((checkIn) => {
        checkedInCustomers.set(checkIn.customer_id, checkIn.id);
      });

      // Add is_checked_in property to customers
      const customersWithCheckInStatus =
        data?.map((customer) => ({
          ...customer,
          is_checked_in: checkedInCustomers.has(customer.id),
          check_in_id: checkedInCustomers.get(customer.id) || undefined,
        })) || [];

      setCustomers(customersWithCheckInStatus);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.store_id) {
      fetchCustomers();
    }
  }, [currentUser?.store_id]);

  const handleFaceDetected = async (faceId: string) => {
    try {
      if (!currentUser?.store_id) {
        console.error("No store_id found for current user");
        return;
      }

      // Get the face ID record with proper typing
      const { data: faceIdRecord, error: faceIdError } = await supabase
        .from("customer_face_ids")
        .select("customer_id")
        .eq("face_id", faceId)
        .single();

      if (faceIdError) {
        if (faceIdError.code === "PGRST116") {
          setMatchedCustomer(null);
          return;
        }
        throw faceIdError;
      }

      if (faceIdRecord?.customer_id) {
        // Get the customer data
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", faceIdRecord.customer_id)
          .single();

        if (customerError) throw customerError;

        if (customerData) {
          // Get check-in status
          const { data: checkIn, error: checkInError } = await supabase
            .from("customer_check_ins")
            .select("id")
            .eq("customer_id", customerData.id)
            .eq("store_id", currentUser.store_id)
            .is("check_out_time", null)
            .maybeSingle();

          if (checkInError) {
            console.error("Error checking check-in status:", checkInError);
          }

          // Now we can safely cast the combined data to Customer type
          setMatchedCustomer({
            ...customerData,
            is_checked_in: !!checkIn,
            check_in_id: checkIn?.id,
          } as Customer);
        }
      }
    } catch (error) {
      console.error("Error searching customer by face:", error);
    }
  };

  const handleCheckIn = async (customer: Customer) => {
    try {
      if (!currentUser?.store_id) {
        console.error("No store_id found for current user");
        toast.error("Store ID not found. Please update your profile.");
        return;
      }

      const { data, error } = await supabase
        .from("customer_check_ins")
        .insert({
          customer_id: customer.id,
          store_id: currentUser.store_id,
          notes: `Checked in via ${
            isFaceSearchActive ? "face recognition" : "customer list"
          }`,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success(`${customer.first_name} checked in successfully`);

      // Update local state
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === customer.id
            ? { ...c, is_checked_in: true, check_in_id: data.id }
            : c
        )
      );

      if (matchedCustomer?.id === customer.id) {
        setMatchedCustomer({
          ...matchedCustomer,
          is_checked_in: true,
          check_in_id: data.id,
        });
      }
    } catch (error) {
      console.error("Error checking in customer:", error);
      toast.error("Failed to check in customer");
    }
  };

  const handleCheckOut = async (customer: Customer) => {
    try {
      if (!customer.check_in_id) {
        console.error("No check_in_id found for customer");
        return;
      }

      const { error } = await supabase
        .from("customer_check_ins")
        .update({
          check_out_time: new Date().toISOString(),
        })
        .eq("id", customer.check_in_id);

      if (error) {
        throw error;
      }

      toast.success(`${customer.first_name} checked out successfully`);

      // Update local state
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === customer.id
            ? { ...c, is_checked_in: false, check_in_id: undefined }
            : c
        )
      );

      if (matchedCustomer?.id === customer.id) {
        setMatchedCustomer({
          ...matchedCustomer,
          is_checked_in: false,
          check_in_id: undefined,
        });
      }
    } catch (error) {
      console.error("Error checking out customer:", error);
      toast.error("Failed to check out customer");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const fullName =
      `${customer.first_name} ${customer.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 5:
        return "bg-green-500";
      case 4:
        return "bg-emerald-500";
      case 3:
        return "bg-blue-500";
      case 2:
        return "bg-amber-500";
      case 1:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <PageLayout title="Customers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <p className="text-muted-foreground">
              Manage your game room customers
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {!isFaceSearchActive && (
              <>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search customers..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsFaceSearchActive(true)}
                  className="w-full sm:w-auto"
                >
                  <UserRound size={16} className="mr-2" />
                  Face Search
                </Button>
                <CustomerDialog onCustomerAdded={fetchCustomers} />
              </>
            )}
          </div>
        </div>

        {isFaceSearchActive ? (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Customer Face Recognition
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsFaceSearchActive(false);
                  setMatchedCustomer(null);
                }}
              >
                <X size={16} className="mr-2" />
                Close
              </Button>
            </div>

            {matchedCustomer ? (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-md border border-green-200 dark:border-green-900">
                  <h4 className="text-lg font-medium text-green-800 dark:text-green-400 mb-2">
                    Customer Found!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We've identified this customer in our system.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-xl">
                      {getInitials(
                        matchedCustomer.first_name,
                        matchedCustomer.last_name
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-2xl font-semibold">
                        {matchedCustomer.first_name} {matchedCustomer.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={getRatingColor(matchedCustomer.rating)}
                        >
                          {matchedCustomer.rating} Star Customer
                        </Badge>
                        {matchedCustomer.is_checked_in && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          >
                            Currently Checked In
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{matchedCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p>{matchedCustomer.phone}</p>
                      </div>
                    </div>

                    {matchedCustomer.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm mt-1">{matchedCustomer.notes}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      {matchedCustomer.is_checked_in ? (
                        <Button
                          variant="outline"
                          onClick={() => handleCheckOut(matchedCustomer)}
                        >
                          Check Out Customer
                        </Button>
                      ) : (
                        <Button onClick={() => handleCheckIn(matchedCustomer)}>
                          <LogIn className="mr-2 h-4 w-4" />
                          Check In Customer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Look directly at the camera to identify a registered customer.
                </p>
                <FaceCapture mode="login" onFaceDetected={handleFaceDetected} />
              </div>
            )}
          </div>
        ) : customers.length > 0 ? (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Rating
                    </TableHead>
                    <TableHead className="w-[100px] text-center">
                      Face ID
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(
                                customer.first_name,
                                customer.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {customer.first_name} {customer.last_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{customer.email}</div>
                          <div className="text-muted-foreground text-sm">
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRatingColor(customer.rating)}>
                          {customer.rating} ★
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.face_id ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                          >
                            Registered
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          >
                            Not Set
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.is_checked_in ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckOut(customer)}
                          >
                            Check Out
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(customer)}
                          >
                            Check In
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <Users size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Customer Database</h3>
            <p className="text-muted-foreground mb-4">
              Your customer management system is ready to be populated. Add your
              first customer to get started.
            </p>
            <CustomerDialog
              isSampleCustomer={true}
              trigger={
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Users size={16} className="mr-2" />
                  Add Sample Customers
                </button>
              }
              onCustomerAdded={fetchCustomers}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Customers;
