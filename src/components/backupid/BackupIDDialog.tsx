
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
import { BackupIDForm } from './BackupIDForm';
import { Plus, IdCard } from 'lucide-react';

interface BackupIDDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const BackupIDDialog: React.FC<BackupIDDialogProps> = ({ 
  trigger = (
    <Button className="bg-game-primary hover:bg-game-primary/90">
      <Plus size={18} className="mr-2" />
      Issue New Card
    </Button>
  ),
  onSuccess
}) => {
  const [open, setOpen] = React.useState(false);

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
          <DialogTitle>Issue Backup ID</DialogTitle>
          <DialogDescription>
            Create a backup identification card or tag for a customer.
          </DialogDescription>
        </DialogHeader>
        <BackupIDForm 
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BackupIDDialog;
