
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
import { BonusForm } from './BonusForm';
import { Plus, Gift } from 'lucide-react';

interface BonusDialogProps {
  trigger?: React.ReactNode;
}

const BonusDialog: React.FC<BonusDialogProps> = ({ 
  trigger = (
    <Button className="bg-game-primary hover:bg-game-primary/90">
      <Plus size={18} className="mr-2" />
      Create Bonus
    </Button>
  ) 
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Bonus</DialogTitle>
          <DialogDescription>
            Create a new bonus that can be assigned to customers.
          </DialogDescription>
        </DialogHeader>
        <BonusForm 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BonusDialog;
