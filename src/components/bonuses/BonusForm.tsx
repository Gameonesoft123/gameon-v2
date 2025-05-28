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
import { getStoreContext } from "@/utils/storeContext";

const formSchema = z.object({
  customerId: z.string({
    required_error: "Please select a customer",
  }),
  bonusName: z.string().min(2, {
    message: "Bonus name must be at least 2 characters.",
  }),
  bonusType: z.string().min(1, {
    message: "Bonus type is required.",
  }),
  bonusAmount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    {
      message: "Bonus amount must be a positive number.",
    }
  ),
  expirationDays: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    {
      message: "Expiration days must be a non-negative number.",
    }
  ),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
});

type BonusFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

type CustomerOption = {
  id: string;
  fullName: string;
};

export function BonusForm({ onSuccess, onCancel }: BonusFormProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      bonusName: "",
      bonusType: "",
      bonusAmount: "",
      expirationDays: "30",
      description: "",
    },
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, first_name, last_name')
          .order('last_name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          setCustomers(data.map(customer => ({
            id: customer.id,
            fullName: `${customer.last_name}, ${customer.first_name}`
          })));
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
      }
    };
    
    fetchCustomers();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const storeId = await getStoreContext();
      
      if (!storeId) {
        setLoading(false);
        return; // Error already handled in getStoreContext
      }

      console.log({...values, store_id: storeId});
      
      sessionStorage.setItem('lastCreatedBonus', JSON.stringify({
        ...values,
        store_id: storeId
      }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Bonus created successfully");
      if (onSuccess) onSuccess();
      
      form.reset({
        customerId: "",
        bonusName: "",
        bonusType: "",
        bonusAmount: "",
        expirationDays: "30",
        description: "",
      });
    } catch (error) {
      console.error('Error creating bonus:', error);
      toast.error("Failed to create bonus");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={customers.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectItem value="no-customers" disabled>
                      No customers found
                    </SelectItem>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.fullName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bonusName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bonus Name</FormLabel>
              <FormControl>
                <Input placeholder="Welcome Bonus, Birthday Special, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bonusType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bonus Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bonus type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash Credit</SelectItem>
                  <SelectItem value="free_play">Free Play</SelectItem>
                  <SelectItem value="points">Loyalty Points</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="gift">Gift Item</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bonusAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input placeholder="10.00" {...field} />
                </FormControl>
                <FormDescription>
                  Dollar amount, point value, or percentage.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expirationDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration (Days)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="30" {...field} />
                </FormControl>
                <FormDescription>
                  Days until this bonus expires after issuance.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this bonus is for and any special conditions..." 
                  className="resize-none"
                  {...field} 
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
          <Button type="submit" disabled={loading || customers.length === 0}>
            {loading ? "Creating..." : "Create Bonus"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
