//i changed this
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setCameraError(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      // Clean up existing stream first
      cleanup();

      setCameraError(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCapturedImage(null);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      return true;
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(true);
      return false;
    }
  }, [cleanup]);

  const stopCamera = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const captureImage = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageDataUrl);

        // Stop the camera after capturing
        stopCamera();

        return imageDataUrl;
      }
    }
    return null;
  };

  // Initialize camera on mount
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        if (mounted) {
          await startCamera();
        }
      } catch (err) {
        console.error("Camera initialization error:", err);
        if (mounted) setCameraError(true);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [startCamera, cleanup]);

  // Handle stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return {
    stream,
    capturedImage,
    cameraError,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureImage,
    cleanup,
  };
};
