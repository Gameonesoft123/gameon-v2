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
import { DollarSign } from 'lucide-react';
import { MatchForm } from './MatchForm';

interface MatchDialogProps {
  trigger?: React.ReactNode;
  onMatchAdded?: () => void;
}

const MatchDialog: React.FC<MatchDialogProps> = ({
  trigger = (
    <Button className="bg-game-primary hover:bg-game-primary/90">
      <DollarSign size={18} className="mr-2" />
      New Match Credit
    </Button>
  ),
  onMatchAdded
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Match Credit</DialogTitle>
          <DialogDescription>
            Create a new match credit transaction for a customer. The customer's deposit will be matched with
            additional playable credits.
          </DialogDescription>
        </DialogHeader>

        <MatchForm
          onSuccess={() => {
            setOpen(false);
            if (onMatchAdded) onMatchAdded();
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MatchDialog;
