
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
import CashRecordForm from './CashRecordForm';
import { Banknote } from 'lucide-react';

interface CashRecordDialogProps {
  trigger?: React.ReactNode;
}

const CashRecordDialog: React.FC<CashRecordDialogProps> = ({ 
  trigger = (
    <Button variant="outline" className="flex justify-start gap-3 h-14 hover:bg-muted/30">
      <Banknote size={20} />
      <div className="text-left">
        <span className="block font-semibold">Record Cash</span>
        <span className="text-xs opacity-70">Start/end of day machine cash</span>
      </div>
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
          <DialogTitle>Record Machine Cash</DialogTitle>
          <DialogDescription>
            Log cash-in at start of day or cash-out at end of day for a machine.
          </DialogDescription>
        </DialogHeader>
        <CashRecordForm 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CashRecordDialog;
