import React, { useState, useCallback, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CapturePreview from "./face-capture/CapturePreview";
import CaptureControls from "./face-capture/CaptureControls";
import ProcessingMessage from "./face-capture/ProcessingMessage";
import { useCamera } from "./face-capture/useCamera";
import { FaceCaptureProps } from "./face-capture/types";
import {
  SUPABASE_URL,
  supabase,
  SUPABASE_PUBLISHABLE_KEY,
} from "@/integrations/supabase/client";

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onCapture,
  onFaceDetected,
  mode,
  customerIdForRegistration,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    stream,
    capturedImage,
    cameraError,
    videoRef,
    canvasRef,
    startCamera,
    captureImage,
    cleanup,
  } = useCamera();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        if (!isInitialized && mounted) {
          await startCamera();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize camera:", error);
      }
    };

    initialize();

    return () => {
      mounted = false;
      cleanup();
      setIsInitialized(false);
    };
  }, [startCamera, cleanup, isInitialized]);

  useEffect(() => {
    setCaptureError(null);
    setIsProcessing(false);
    if (!isInitialized) {
      startCamera();
    }
  }, [mode, startCamera, isInitialized]);

  const handleError = (message: string, error?: any) => {
    console.error(`FaceCapture (Customer): ${message}`, error || "");
    setCaptureError(message);
    setIsProcessing(false);
  };

  const sendToFaceRecognition = useCallback(
    async (imageDataUrl: string) => {
      if (mode === "register" && !customerIdForRegistration) {
        handleError(
          "Cannot register face: Missing unique ID for registration."
        );
        return;
      }

      console.log(
        "FaceCapture (Customer): Preparing to send to face recognition..."
      );
      setIsProcessing(true);
      setCaptureError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(
          "FaceCapture (Customer): Face recognition request timed out via AbortController."
        );
        controller.abort();
      }, 30000); // 30 second timeout

      try {
        const requestAction = mode === "login" ? "identify" : "register";
        const requestBody: {
          action: string;
          image: string;
          customerId?: string;
        } = {
          action: requestAction,
          image: imageDataUrl,
        };

        if (mode === "register") {
          requestBody.customerId = customerIdForRegistration;
        }

        const functionUrl = `${SUPABASE_URL}/functions/v1/face-recognition-v3`;
        console.log(
          `Customer FaceCapture: Sending to Face Recognition. URL: ${functionUrl}, Action: ${requestAction}, Mode: ${mode}, CustomerID (for register): ${
            requestBody.customerId || "N/A"
          }`
        );

        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const result = await response.json();
        console.log("Customer FaceCapture: Face recognition result:", result);

        if (!response.ok || result.success === false) {
          const errorMsg =
            result.error ||
            `Face recognition failed (status ${response.status})`;
          console.error(
            `Customer FaceCapture: Error from recognition function: ${errorMsg}`,
            result
          );
          throw new Error(errorMsg);
        }

        const ourApplicationId = result.externalImageId || result.customerId;
        if (ourApplicationId) {
          console.log(`Customer FaceCapture: Success. ID: ${ourApplicationId}`);
          if (onFaceDetected) {
            onFaceDetected(ourApplicationId);
          }
        } else {
          console.error(
            "Customer FaceCapture: Our ID (externalImageId/customerId) missing in successful response",
            result
          );
          handleError(
            "Processing successful, but customer's unique ID was not returned."
          );
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          handleError("Face recognition request timed out. Please try again.");
        } else {
          const backendError =
            error.message &&
            error.message.toLowerCase().includes("no face detected")
              ? error.message
              : error.message ||
                "Error processing face recognition. Please try again.";
          handleError(backendError, error);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [
      mode,
      customerIdForRegistration,
      onFaceDetected,
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
    ]
  );

  const handleRetake = useCallback(() => {
    console.log("FaceCapture (Customer): Retake initiated.");
    setCaptureError(null);
    setIsProcessing(false);
    if (!stream) {
      startCamera();
    }
  }, [stream, startCamera]);

  const handleCapture = () => {
    console.log("FaceCapture (Customer): Capture initiated.");
    const imageDataUrl = captureImage();
    if (imageDataUrl) {
      if (onCapture) {
        onCapture(imageDataUrl);
      }
      sendToFaceRecognition(imageDataUrl);
    } else {
      setCaptureError(
        "Failed to capture image. Camera might not be active or permissions denied."
      );
    }
  };

  if (cameraError) {
    return (
      <div className="border border-border rounded-md p-4 bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          <h4 className="font-medium">Camera not available</h4>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Please use alternative methods if available."
              : "Face ID registration requires camera access."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-border bg-card">
        <CapturePreview
          stream={stream}
          capturedImage={capturedImage}
          videoRef={videoRef}
        />

        <canvas ref={canvasRef} className="hidden" />

        {captureError && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-full text-sm w-11/12 text-center">
            {captureError}
          </div>
        )}

        {isProcessing && !captureError && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm">
            Processing...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <CaptureControls
          hasStream={!!stream}
          hasImage={!!capturedImage}
          isProcessing={isProcessing}
          onCapture={handleCapture}
          onRetake={handleRetake}
          mode={mode}
          isFaceDetected={true}
        />
      </div>
      <ProcessingMessage isProcessing={isProcessing} mode={mode} />
    </div>
  );
};

export default FaceCapture;
