import React from 'react';
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from 'lucide-react';
import { FaceCaptureMode } from './types';

interface CaptureControlsProps {
  hasStream: boolean;
  hasImage: boolean;
  isProcessing: boolean;
  onCapture: () => void;
  onRetake: () => void;
  mode: FaceCaptureMode;
  isFaceDetected: boolean;
}

const CaptureControls: React.FC<CaptureControlsProps> = ({
  hasStream,
  hasImage,
  isProcessing,
  onCapture,
  onRetake,
  mode,
  isFaceDetected
}) => {
  if (hasImage) {
    return (
      <Button
        onClick={onRetake}
        variant="outline"
        disabled={isProcessing}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Retake
      </Button>
    );
  }

  return (
    <Button
      onClick={onCapture}
      disabled={!hasStream || isProcessing || !isFaceDetected}
    >
      <Camera className="mr-2 h-4 w-4" />
      {mode === 'register' ? 'Capture Face ID' : 'Scan Face to Login'}
    </Button>
  );
};

export default CaptureControls;
