
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CustomerForm from './CustomerForm';
import { UserPlus, Store, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useAuth } from '@/contexts/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from 'react-router-dom';
import { getStoreContext } from "@/utils/storeContext";
import { useStoreContext } from "@/utils/storeContext";

interface CustomerDialogProps {
  trigger?: React.ReactNode;
  isSampleCustomer?: boolean;
  onCustomerAdded?: () => void;
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ 
  trigger = (
    <Button className="bg-game-primary hover:bg-game-primary/90">
      <UserPlus size={18} className="mr-2" />
      New Customer
    </Button>
  ),
  isSampleCustomer = false,
  onCustomerAdded
}) => {
  const [open, setOpen] = useState(false);
  const { currentUser } = useAuth();
  const { hasStore } = useStoreContext();

  const addSampleCustomers = async () => {
    try {
      const storeId = await getStoreContext();
      
      if (!storeId) {
        return; // Error already handled in getStoreContext
      }

      const sampleCustomers = [
        { first_name: 'John', last_name: 'Smith', phone: '555-123-4567', email: 'john.smith@example.com', rating: 5, store_id: storeId },
        { first_name: 'Maria', last_name: 'Garcia', phone: '555-987-6543', email: 'maria.garcia@example.com', rating: 4, store_id: storeId },
        { first_name: 'Robert', last_name: 'Johnson', phone: '555-456-7890', email: 'robert.johnson@example.com', rating: 3, store_id: storeId },
        { first_name: 'Samantha', last_name: 'Williams', phone: '555-789-0123', email: 'samantha.williams@example.com', rating: 5, store_id: storeId },
        { first_name: 'David', last_name: 'Brown', phone: '555-321-6547', email: 'david.brown@example.com', rating: 4, store_id: storeId }
      ];
      
      const { error } = await supabase
        .from('customers')
        .insert(sampleCustomers);
        
      if (error) throw error;
      
      toast.success("Sample customers added successfully");
      setOpen(false);
      if (onCustomerAdded) onCustomerAdded();
    } catch (error) {
      console.error('Error adding sample customers:', error);
      toast.error("Failed to add sample customers");
    }
  };

  const createCustomer = async (data: any) => {
    if (!currentUser?.store_id) {
      toast.error("Store ID not found. Please update your profile first.");
      return { success: false, error: "No store ID found" };
    }
    
    const customerData = {
      ...data,
      store_id: currentUser.store_id
    };
    
    const { error } = await supabase
      .from('customers')
      .insert(customerData);
      
    if (error) {
      return { success: false, error };
    }
    
    return { success: true };
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !hasStore) {
      // If opening the dialog and there's no store_id, show the dialog anyway
      // The form will handle displaying the appropriate message
      console.log("Opening dialog without store_id");
    }
    setOpen(newOpen);
  };

  const StoreSetupGuide = () => (
    <>
      <div className="space-y-4 py-4">
        <Alert>
          <AlertDescription>
            Before you can add customers, you need to set up a store for your account.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-6 mt-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Update your profile</h3>
              <p className="text-sm text-muted-foreground">
                Go to your profile and add a store name to create a store for your account.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Add customers</h3>
              <p className="text-sm text-muted-foreground">
                Once your store is set up, you can return here to add customers.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/profile">
            Go to Profile <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {!hasStore
              ? "Store Setup Required" 
              : isSampleCustomer 
                ? "Add Sample Customers" 
                : "Add New Customer"}
          </DialogTitle>
          <DialogDescription>
            {!hasStore
              ? "You need to set up a store before adding customers."
              : isSampleCustomer 
                ? "Add a set of sample customers to get started quickly."
                : "Create a new customer profile with facial ID and contact information."}
          </DialogDescription>
        </DialogHeader>
        
        {!hasStore ? (
          <StoreSetupGuide />
        ) : isSampleCustomer ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will add 5 sample customers with different ratings to help you get started with the system.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSampleCustomers}>
                Add Sample Customers
              </Button>
            </div>
          </div>
        ) : (
          <CustomerForm 
            onSuccess={() => {
              setOpen(false);
              if (onCustomerAdded) onCustomerAdded();
            }}
            onCancel={() => setOpen(false)}
            createCustomer={createCustomer}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
