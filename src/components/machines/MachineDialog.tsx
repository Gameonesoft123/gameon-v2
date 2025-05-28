import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MachineForm } from './MachineForm';
import { Plus, Edit2, Gamepad2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getStoreContext } from "@/utils/storeContext";

interface MachineDialogProps {
  trigger?: React.ReactNode;
  isSampleMachine?: boolean;
  machine?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
}

const MachineDialog: React.FC<MachineDialogProps> = ({ 
  trigger = (
    <Button className="bg-game-primary hover:bg-game-primary/90">
      <Plus size={18} className="mr-2" />
      Add Machine
    </Button>
  ),
  isSampleMachine = false,
  machine = null,
  isEdit = false,
  onSuccess
}) => {
  const [open, setOpen] = React.useState(false);

  const addSampleMachines = async () => {
    try {
      const storeId = await getStoreContext();
      
      if (!storeId) {
        return; // Error already handled in getStoreContext
      }

      const sampleMachines = [
        { name: 'Lucky 7s Slot', description: 'Standard slot machine', location: 'East Wing', status: 'active', store_id: storeId },
        { name: 'Royal Flush Poker', description: 'Video poker machine', location: 'Card Room', status: 'active', store_id: storeId },
        { name: 'Blackjack Pro', description: 'Electronic blackjack table', location: 'Table Games', status: 'active', store_id: storeId },
        { name: 'Mega Wheel', description: 'Fortune wheel game', location: 'Center Floor', status: 'maintenance', store_id: storeId },
        { name: 'Classic Roulette', description: 'Digital roulette table', location: 'VIP Room', status: 'inactive', store_id: storeId }
      ];
      
      const { error } = await (supabase as any)
        .from('machines')
        .insert(sampleMachines);
        
      if (error) throw error;
      
      toast.success("Sample machines added successfully");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding sample machines:', error);
      toast.error("Failed to add sample machines");
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{
            isSampleMachine ? "Add Sample Machines" : 
            isEdit ? `Edit Machine: ${machine?.name}` : 
            "Add New Machine"
          }</DialogTitle>
          <DialogDescription>
            {isSampleMachine 
              ? "Add a set of sample game machines to get started quickly."
              : isEdit 
                ? "Update the details of your game machine including status."
                : "Register a new game machine to track performance and cash."
            }
          </DialogDescription>
        </DialogHeader>
        
        {isSampleMachine ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will add 5 sample machines with different statuses to help you get started with the system.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSampleMachines}>
                Add Sample Machines
              </Button>
            </div>
          </div>
        ) : (
          <MachineForm 
            machineData={isEdit ? machine : undefined}
            isEdit={isEdit}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MachineDialog;
