
import React from 'react';
import { FaceCaptureMode } from './types';

interface ProcessingMessageProps {
  isProcessing: boolean;
  mode: FaceCaptureMode;
}

const ProcessingMessage: React.FC<ProcessingMessageProps> = ({ 
  isProcessing, 
  mode 
}) => {
  if (!isProcessing) return null;
  
  return (
    <div className="text-center text-sm text-muted-foreground">
      {mode === 'register' 
        ? 'Processing and storing your facial data...'
        : 'Identifying your face...'}
    </div>
  );
};

export default ProcessingMessage;
