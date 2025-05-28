
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

const formSchema = z.object({
  customerId: z.string().min(1, {
    message: "Customer selection is required.",
  }),
  idType: z.string().min(1, {
    message: "ID type is required.",
  }),
  idNumber: z.string().min(4, {
    message: "ID number must be at least 4 characters.",
  }),
  reasonForUse: z.string().min(1, {
    message: "Reason for use is required.",
  }),
});

type BackupIDFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

type CustomerOption = {
  id: string;
  name: string;
};

export function BackupIDForm({ onSuccess, onCancel }: BackupIDFormProps) {
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardIdInput, setCardIdInput] = useState('');
  const [waitingForScan, setWaitingForScan] = useState(false);
  const cardInputRef = React.useRef<HTMLInputElement>(null);
  const { currentUser, currentStoreId } = useAuth();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const query = supabase.from('customers').select('id, first_name, last_name');
        
        if (currentStoreId) {
          query.eq('store_id', currentStoreId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching customers:', error);
          toast.error('Failed to load customers: ' + error.message);
          return;
        }
        
        if (data) {
          console.log('Customers loaded:', data.length);
          const formattedCustomers = data.map(customer => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`
          }));
          setCustomerOptions(formattedCustomers);
        }
      } catch (error) {
        console.error('Exception fetching customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [currentStoreId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      idType: "rfid",
      idNumber: "",
      reasonForUse: "facial_recognition_failed",
    },
  });

  useEffect(() => {
    if (waitingForScan && cardInputRef.current) {
      cardInputRef.current.focus();
    }
  }, [waitingForScan]);

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardIdInput(e.target.value);
  };

  const handleCardInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && cardIdInput) {
      form.setValue('idNumber', cardIdInput);
      setWaitingForScan(false);
      setCardIdInput('');
      toast.success("RFID card detected and registered");
    }
  };

  const startCardScan = () => {
    setWaitingForScan(true);
    setCardIdInput('');
    setTimeout(() => {
      if (cardInputRef.current) {
        cardInputRef.current.focus();
      }
    }, 100);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!currentStoreId) {
        toast.error("No store context found. Please refresh the page and try again.");
        return;
      }

      console.log("Issuing backup ID with values:", values);
      console.log("Using store ID:", currentStoreId);

      const { data, error } = await supabase
        .from('backup_ids')
        .insert({
          customer_id: values.customerId,
          card_id: values.idNumber,
          store_id: currentStoreId,
          notes: `ID Type: ${values.idType}, Reason: ${values.reasonForUse}`
        })
        .select();
        
      if (error) {
        console.error("Error inserting backup ID:", error);
        throw error;
      }
      
      console.log("Backup ID issued successfully:", data);
      toast.success("Backup ID issued successfully");
      form.reset();
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error creating backup ID:', error);
      toast.error(`Failed to issue backup ID: ${error.message || "Unknown error"}`);
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
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                  ) : customerOptions.length > 0 ? (
                    customerOptions.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-customers" disabled>No customers found</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the customer who needs a backup ID.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="idType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="rfid">RFID Card</SelectItem>
                  <SelectItem value="nfc">NFC Tag</SelectItem>
                  <SelectItem value="barcode">Barcode Card</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="idNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Number</FormLabel>
              <div className="space-y-2">
                <FormControl>
                  <Input 
                    placeholder="Card ID or Serial Number" 
                    {...field} 
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={startCardScan}
                  className="w-full flex items-center justify-center"
                >
                  <LogIn className="mr-2 h-4 w-4" /> Scan RFID Card
                </Button>
              </div>
              <FormDescription>
                Enter the unique ID number printed on the card or tag, or use the scanner.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {waitingForScan && (
          <Alert variant="default" className="bg-muted/50">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Waiting for RFID scan...</AlertTitle>
            <AlertDescription>
              Hold the RFID card near the scanner.
              <div className="mt-2">
                <Input
                  ref={cardInputRef}
                  type="text"
                  placeholder="Card input will appear here..."
                  className="bg-background"
                  value={cardIdInput}
                  onChange={handleCardInputChange}
                  onKeyDown={handleCardInputKeyDown}
                  autoFocus
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="reasonForUse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Backup ID</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="facial_recognition_failed">Facial Recognition Failed</SelectItem>
                  <SelectItem value="customer_preference">Customer Preference</SelectItem>
                  <SelectItem value="system_maintenance">System Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
          <Button type="submit">Issue ID</Button>
        </div>
      </form>
    </Form>
  );
}

export default BackupIDForm;
