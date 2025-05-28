
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FaceCapture from '@/components/customers/faceid/FaceCapture'; // Customer specific FaceCapture
// Assuming FaceCaptureProps and FaceCaptureMode might be relevant if they were defined locally
// For now, we're relying on the imported FaceCapture component's prop typings.

interface CustomerFaceScanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFaceDetected: (faceId: string) => void;
  storeId: string | undefined; // Needed if FaceCapture requires it
}

const CustomerFaceScanDialog: React.FC<CustomerFaceScanDialogProps> = ({
  isOpen,
  onOpenChange,
  onFaceDetected,
  // storeId prop is available but not used by FaceCapture in this snippet
}) => {
  const handleInternalFaceDetected = (faceId: string) => {
    onFaceDetected(faceId);
    onOpenChange(false); // Close dialog after detection
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customer Face Scan</DialogTitle>
          <DialogDescription>
            Position the customer's face in the frame. The system will attempt to identify them.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isOpen && ( // Only render FaceCapture when dialog is open to ensure camera starts correctly
            <FaceCapture
              mode="login" // Changed from "identify" to "login".
                           // The customer FaceCapture component internally maps 'login' mode to an 'identify' action.
              onFaceDetected={handleInternalFaceDetected}
              // onCapture can be omitted if we only care about the recognized faceId
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFaceScanDialog;

