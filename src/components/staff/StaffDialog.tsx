
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StaffForm } from './StaffForm';
import { UserPlus, Store, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { getStoreContext } from '@/utils/storeContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from 'react-router-dom';
import { useStoreContext } from '@/utils/storeContext';

interface StaffDialogProps {
  trigger?: React.ReactNode;
  isSampleStaff?: boolean;
  onStaffAdded?: () => void;
}

const StaffDialog: React.FC<StaffDialogProps> = ({ 
  trigger = (
    <Button className="bg-game-primary hover:bg-game-primary/90">
      <UserPlus size={18} className="mr-2" />
      Add Staff Member
    </Button>
  ),
  isSampleStaff = false,
  onStaffAdded
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { hasStore } = useStoreContext();

  const addSampleStaff = async () => {
    try {
      setLoading(true);
      // Get the store_id from the user's profile
      const storeId = await getStoreContext();
      
      if (!storeId) {
        setLoading(false);
        return; // Error already handled in getStoreContext
      }

      const sampleStaff = [
        { 
          first_name: 'John', 
          last_name: 'Manager', 
          email: 'john.manager@example.com', 
          phone_number: '555-123-4567', 
          role: 'manager',
          username: 'johnmanager',
          password_hash: 'hashed_password_1',
          store_id: storeId
        },
        { 
          first_name: 'Sarah', 
          last_name: 'Admin', 
          email: 'sarah.admin@example.com', 
          phone_number: '555-987-6543', 
          role: 'owner',
          username: 'sarahadmin',
          password_hash: 'hashed_password_2',
          store_id: storeId
        },
        { 
          first_name: 'Michael', 
          last_name: 'Worker', 
          email: 'michael.worker@example.com', 
          phone_number: '555-456-7890', 
          role: 'employee',
          username: 'michaelworker',
          password_hash: 'hashed_password_3',
          store_id: storeId
        }
      ];
      
      const { error } = await supabase
        .from('staff')
        .insert(sampleStaff);
        
      if (error) throw error;
      
      toast.success("Sample staff members added successfully");
      setOpen(false);
      if (onStaffAdded) onStaffAdded();
    } catch (error) {
      console.error('Error adding sample staff members:', error);
      toast.error("Failed to add sample staff members");
    } finally {
      setLoading(false);
    }
  };

  const StoreSetupGuide = () => (
    <>
      <div className="space-y-4 py-4">
        <Alert>
          <AlertDescription>
            Before you can add staff members, you need to set up a store for your account.
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
              <h3 className="font-medium">Add staff members</h3>
              <p className="text-sm text-muted-foreground">
                Once your store is set up, you can return here to add staff members.
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {!hasStore
              ? "Store Setup Required" 
              : isSampleStaff 
                ? "Add Sample Staff" 
                : "Add Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {!hasStore
              ? "You need to set up a store before adding staff members."
              : isSampleStaff 
                ? "Add a set of sample staff members to get started quickly." 
                : "Create a new staff account with role-based permissions."}
          </DialogDescription>
        </DialogHeader>
        
        {!hasStore ? (
          <StoreSetupGuide />
        ) : isSampleStaff ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will add 3 sample staff members with different roles to help you get started with the system.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSampleStaff} disabled={loading}>
                {loading ? "Adding..." : "Add Sample Staff"}
              </Button>
            </div>
          </div>
        ) : (
          <StaffForm 
            onSuccess={() => {
              setOpen(false);
              if (onStaffAdded) onStaffAdded();
            }}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StaffDialog;
