
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { FaceCaptureMode } from './types';

interface FaceDetectionOptions {
  mode: FaceCaptureMode;
  onFaceDetected?: (faceId: string) => void;
}

export const useFaceDetection = ({ mode, onFaceDetected }: FaceDetectionOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const detectFace = async (imageDataUrl: string) => {
    try {
      setIsProcessing(true);
      
      // In a real implementation, you would call your face recognition edge function
      // For demo purposes, we'll simulate this process with a timeout and generate a random face ID
      
      const mockFaceId = `face_${Math.random().toString(36).substring(2, 15)}`;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onFaceDetected) {
        onFaceDetected(mockFaceId);
      }
      
      toast.success('Face detected and stored successfully');
      return mockFaceId;
    } catch (error) {
      console.error('Error detecting face:', error);
      toast.error('Failed to detect face. Please try again.');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const identifyFace = async (imageDataUrl: string) => {
    try {
      setIsProcessing(true);
      
      // In a real implementation, you would call your face recognition edge function
      // For demo purposes, we'll simulate a successful identification

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful identification
      const mockFaceId = `face_${Math.random().toString(36).substring(2, 15)}`;
      
      if (onFaceDetected) {
        onFaceDetected(mockFaceId);
      }
      
      toast.success('Face recognized successfully');
      return mockFaceId;
    } catch (error) {
      console.error('Error identifying face:', error);
      toast.error('Failed to identify face. Please try again or use manual login.');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const processFace = async (imageDataUrl: string) => {
    if (mode === 'register') {
      return await detectFace(imageDataUrl);
    } else {
      return await identifyFace(imageDataUrl);
    }
  };

  return {
    isProcessing,
    processFace
  };
};
