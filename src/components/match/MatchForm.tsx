import React, { useState, useEffect } from 'react';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getStoreContext } from '@/utils/storeContext';

const formSchema = z.object({
  customerId: z.string().min(1, { message: "Customer is required" }),
  machineId: z.string().min(1, { message: "Machine is required" }),
  initialAmount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Initial amount must be a positive number",
  }),
  matchPercentage: z.string().default("100").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Match percentage must be a positive number",
  }),
  notes: z.string().optional(),
});

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  hasMatchToday?: boolean;
};

type Machine = {
  id: string;
  name: string;
  status: string;
};

type MatchFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function MatchForm({ onSuccess, onCancel }: any) {
  const { currentUser } = useAuth();
  const { settings } = useAppSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [hasMatchToday, setHasMatchToday] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    matchedAmount: 0,
    totalCredits: 0,
    redemptionThreshold: 0
  });
  const [userStore, setUserStore] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      machineId: "",
      initialAmount: "",
      matchPercentage: "100",
      notes: ""
    },
  });

  // Get user's store ID from their profile directly
  useEffect(() => {
    const getUserStore = async () => {
      if (!currentUser) {
        console.log("No current user found");
        return;
      }
      
      try {
        // First, try to get store_id directly from the currentUser object
        if (currentUser.store_id) {
          console.log("Store ID found in currentUser:", currentUser.store_id);
          setUserStore(currentUser.store_id);
          return;
        }
        
        // If not found in currentUser, try to get it from the profile
        const { data, error } = await supabase.rpc('get_user_store_id');
        
        if (error) {
          console.error("Error getting store ID from RPC:", error);
          throw error;
        }
        
        console.log("User store ID from RPC:", data);
        if (data) {
          setUserStore(data);
        } else {
          console.error("No store ID returned from RPC");
          
          // As a fallback, try to get it directly from the profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('store_id')
            .eq('id', currentUser.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching profile:", profileError);
            throw profileError;
          }
          
          if (profileData && profileData.store_id) {
            console.log("Store ID found in profile:", profileData.store_id);
            setUserStore(profileData.store_id);
          } else {
            console.error("No store ID found in profile");
          }
        }
      } catch (error) {
        console.error("Error getting user store ID:", error);
      }
    };
    
    getUserStore();
  }, [currentUser]);

  // Calculate values when initialAmount or matchPercentage changes
  const initialAmount = form.watch("initialAmount");
  const matchPercentage = form.watch("matchPercentage");
  const customerId = form.watch("customerId");

  useEffect(() => {
    // When customer changes, check if they already have a match today
    if (customerId && customerId !== selectedCustomerId) {
      setSelectedCustomerId(customerId);
      checkCustomerDailyMatch(customerId);
    }
  }, [customerId, selectedCustomerId]);

  const checkCustomerDailyMatch = async (customerId: string) => {
    try {
      // Get current date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Check if customer already has a match today
      const { data, error } = await supabase
        .from('match_transactions')
        .select('id')
        .eq('customer_id', customerId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(1);
        
      if (error) throw error;
      
      const hasMatch = data && data.length > 0;
      setHasMatchToday(hasMatch);
    } catch (error) {
      console.error('Error checking customer match:', error);
    }
  };

  useEffect(() => {
    const amount = parseFloat(initialAmount) || 0;
    const percentage = parseFloat(matchPercentage) || 100;
    
    const matched = amount * (percentage / 100);
    const total = amount + matched;
    // Use the threshold from settings if available, otherwise default to 2x total credits
    const threshold = settings.matchThreshold > 0 ? settings.matchThreshold : total * 2;

    setCalculatedValues({
      matchedAmount: matched,
      totalCredits: total,
      redemptionThreshold: threshold
    });
  }, [initialAmount, matchPercentage, settings.matchThreshold]);

  // Fetch customers and machines
  useEffect(() => {
    const fetchCustomersAndMachines = async () => {
      try {
        setLoading(true);
        
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .order('last_name', { ascending: true });
          
        if (customersError) throw customersError;
        
        // Fetch active machines
        const { data: machinesData, error: machinesError } = await supabase
          .from('machines')
          .select('id, name, status')
          .eq('status', 'active')
          .order('name', { ascending: true });
          
        if (machinesError) throw machinesError;
        
        setCustomers(customersData || []);
        setMachines(machinesData || []);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomersAndMachines();
  }, []);

  async function onSubmit(values: any) {
    try {
      // Get the store_id from the user's profile
      const storeId = await getStoreContext();
      
      if (!storeId) {
        return; // Error already handled in getStoreContext
      }

      // Calculate matched amount and total credits
      const initialAmount = parseFloat(values.initialAmount);
      const matchPercentage = parseFloat(values.matchPercentage) || 100;
      const matchedAmount = (initialAmount * matchPercentage) / 100;
      const totalCredits = initialAmount + matchedAmount;
      
      const { data, error } = await supabase
        .from('match_transactions')
        .insert({
          customer_id: values.customerId,
          machine_id: values.machineId,
          initial_amount: initialAmount,
          match_percentage: matchPercentage,
          matched_amount: matchedAmount,
          total_credits: totalCredits,
          redemption_threshold: values.redemptionThreshold ? parseFloat(values.redemptionThreshold) : totalCredits,
          status: 'active',
          notes: values.notes || null,
          store_id: storeId,
          created_by: currentUser?.id || null
        })
        .select();
        
      if (error) throw error;
      
      toast.success("Match credit created successfully");
      form.reset();
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating match credit:', error);
      toast.error("Failed to create match credit");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Show warning if customer already has a match today */}
        {hasMatchToday && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This customer has already received a match credit today. Only one match credit is allowed per customer per day.
            </AlertDescription>
          </Alert>
        )}

        {/* Machine Selection */}
        <FormField
          control={form.control}
          name="machineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Machine</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Initial Amount */}
        <FormField
          control={form.control}
          name="initialAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Amount ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Customer's cash deposit amount
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Match Percentage */}
        <FormField
          control={form.control}
          name="matchPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Match Percentage (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="200" 
                  step="1" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Percentage of initial amount to match (default: 100%)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Calculated Summary */}
        <div className="grid grid-cols-3 gap-4 bg-muted p-4 rounded-md">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Matched Amount</p>
            <p className="text-lg font-medium">${calculatedValues.matchedAmount.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Credits</p>
            <p className="text-lg font-medium">${calculatedValues.totalCredits.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Redemption Threshold</p>
            <p className="text-lg font-medium">${calculatedValues.redemptionThreshold.toFixed(2)}</p>
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={hasMatchToday}>Create Match Credit</Button>
        </div>
      </form>
    </Form>
  );
}

export default MatchForm;
