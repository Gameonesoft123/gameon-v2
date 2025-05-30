import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setCameraError(null);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      // Clean up existing stream first
      cleanup();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraError("Failed to access camera");
    }
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
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
        cleanup();

        return imageDataUrl;
      }
    }
    return null;
  };

  useEffect(() => {
    // Don't block component rendering if camera fails
    let mounted = true;

    const initCamera = async () => {
      try {
        await startCamera();
      } catch (err) {
        console.error("Camera initialization error:", err);
        if (mounted) setCameraError("Failed to initialize camera");
      }
    };

    // Initialize camera without awaiting
    initCamera();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [startCamera, cleanup]);

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
    captureImage,
    cleanup,
  };
};
