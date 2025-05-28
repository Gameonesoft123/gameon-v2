
import React from 'react';
import { Image } from 'lucide-react';

interface CapturePreviewProps {
  stream: MediaStream | null;
  capturedImage: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CapturePreview: React.FC<CapturePreviewProps> = ({
  stream,
  capturedImage,
  videoRef
}) => {
  if (stream) {
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
    );
  }
  
  if (capturedImage) {
    return (
      <img 
        src={capturedImage} 
        alt="Captured face" 
        className="w-full h-full object-cover"
      />
    );
  }
  
  return (
    <div className="aspect-video bg-muted flex items-center justify-center">
      <Image className="h-12 w-12 text-muted-foreground" />
    </div>
  );
};

export default CapturePreview;
