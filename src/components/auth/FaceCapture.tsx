import React, { useEffect, useState, useRef, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CapturePreview from "./face-capture/CapturePreview";
import CaptureControls from "./face-capture/CaptureControls";
import ProcessingMessage from "./face-capture/ProcessingMessage";
import { useCamera } from "./face-capture/useCamera";
import { FaceCaptureProps } from "./face-capture/types";
import * as faceapi from "face-api.js";
import {
  supabase,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "@/integrations/supabase/client";

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onCapture,
  onFaceDetected,
  mode,
  externalImageIdForRegistration,
}) => {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isFaceDetectedState, setIsFaceDetectedState] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [isProcessingRecognition, setIsProcessingRecognition] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const modelsLoadedRef = useRef(false); // Ref to track if models are loaded

  const {
    stream,
    capturedImage,
    cameraError,
    videoRef,
    canvasRef,
    startCamera,
    captureImage,
    stopCamera,
  } = useCamera();

  const clearDetectionInterval = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = undefined;
      console.log("FaceCapture (Auth): Cleared detection interval.");
    }
  }, []);

  const handleError = useCallback(
    (message: string, error?: any) => {
      console.error(`FaceCapture (Auth): ${message}`, error || "");
      setDetectionError(message);
      setIsProcessingRecognition(false); // Ensure processing state is reset
      clearDetectionInterval(); // Stop detection attempts on error
    },
    [clearDetectionInterval]
  );

  // Function to send image to AWS face recognition
  const sendToFaceRecognition = useCallback(
    async (imageDataUrl: string) => {
      if (mode === "register" && !externalImageIdForRegistration) {
        handleError(
          "Cannot register face: Missing unique ID for registration."
        );
        return;
      }

      console.log(
        "FaceCapture (Auth): Preparing to send to face recognition..."
      );
      setIsProcessingRecognition(true);
      setDetectionError(null);

      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/face-recognition-v3`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              action: mode === "register" ? "register" : "identify",
              image: imageDataUrl,
              customerId: externalImageIdForRegistration,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Face recognition response:", data);

        if (data.success) {
          if (onFaceDetected) {
            onFaceDetected(
              data.faceId || data.bestMatch?.Face?.ExternalImageId
            );
          }
          const faceRecord = data.fullData.FaceRecords?.[0];
          const faceId = faceRecord?.Face?.FaceId;
          const userId = faceRecord?.Face?.ExternalImageId;
          const faceDetail = faceRecord?.FaceDetail;

          const { data: supabaseInsert, error: supabaseError } = await supabase
            .from("user_face_ids")
            .insert({
              user_id: userId,
              face_id: faceId,
              face_data: faceDetail,
            })
            .select()
            .single();

          if (supabaseError) {
            console.error("Supabase insert error:", supabaseError);
            throw new Error("Failed to insert face data into Supabase");
          }
        } else {
          throw new Error(data.error || "Face recognition failed");
        }
      } catch (error: any) {
        console.error("Face recognition error:", error);
        handleError(error.message || "Face recognition failed");
      } finally {
        setIsProcessingRecognition(false);
      }
    },
    [mode, externalImageIdForRegistration, handleError, onFaceDetected]
  );

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      if (modelsLoadedRef.current) {
        console.log(
          "FaceCapture (Auth): Models already loaded or loading initiated."
        );
        return;
      }
      console.log(
        "FaceCapture (Auth): Attempting to load face-api.js models..."
      );
      setIsModelLoading(true);
      modelsLoadedRef.current = true;
      setDetectionError(null);
      try {
        const modelUrl = "/models";

        // Only load TinyFaceDetector model
        await faceapi.nets.tinyFaceDetector.load(modelUrl);
        console.log(
          "FaceCapture (Auth): TinyFaceDetector model loaded successfully"
        );

        console.log(
          "FaceCapture (Auth): All face-api.js models loaded successfully."
        );
        setIsModelLoading(false);
        modelsLoadedRef.current = true;
      } catch (error: any) {
        console.error(
          "FaceCapture (Auth): Error loading face detection models:",
          error
        );
        setDetectionError(
          `Failed to load face detection models: ${error.message}. Please refresh.`
        );
        setIsModelLoading(false);
        modelsLoadedRef.current = false;
      }
    };

    loadModels();
    // Cleanup function to stop camera and interval when component unmounts
    return () => {
      clearDetectionInterval();
      if (stream) {
        // Ensure stream exists before trying to stop
        stopCamera(); // Assuming stopCamera is from useCamera and handles its own null checks
      }
      console.log(
        "FaceCapture (Auth): Unmounted, cleaned up interval and camera."
      );
    };
  }, [clearDetectionInterval, stopCamera, stream]); // Added stream and stopCamera dependencies for cleanup

  // Face detection interval logic
  useEffect(() => {
    const detectFace = async () => {
      if (
        !videoRef.current ||
        !stream ||
        videoRef.current.readyState < videoRef.current.HAVE_ENOUGH_DATA ||
        isModelLoading ||
        !modelsLoadedRef.current
      ) {
        // console.log("FaceCapture (Auth): detectFace - conditions not met.", {isModelLoading, modelsLoaded: modelsLoadedRef.current, hasStream: !!stream, videoReady: videoRef.current?.readyState});
        return;
      }

      if (videoRef.current.paused) {
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error(
            "FaceCapture (Auth): detectFace - error trying to play video:",
            playError
          );
          // Do not setDetectionError here as it might be transient
          return;
        }
      }

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
          })
        ); // Remove .withFaceLandmarks() since we're not loading that model

        if (detections.length > 0) {
          console.log(
            "FaceCapture (Auth): Face detected locally by face-api.js."
          );
          setIsFaceDetectedState(true);
          setDetectionError(null);
          clearDetectionInterval(); // Stop further local detections

          if (!isProcessingRecognition && !capturedImage) {
            console.log(
              "FaceCapture (Auth): Capturing image for recognition send."
            );
            const imageDataUrl = captureImage();
            if (imageDataUrl) {
              await sendToFaceRecognition(imageDataUrl);
            } else {
              console.warn(
                "FaceCapture (Auth): Image capture failed after local detection."
              );
              setDetectionError("Failed to capture image after detection.");
            }
          }
        } else {
          setIsFaceDetectedState(false);
        }
      } catch (error: any) {
        console.error(
          "FaceCapture (Auth): Error detecting face with face-api.js:",
          error
        );
        setDetectionError(
          "Error during local face detection. Models might be loading or an issue occurred."
        );
        clearDetectionInterval();
      }
    };

    clearDetectionInterval(); // Clear any existing interval before setting a new one

    if (
      stream &&
      !isModelLoading &&
      modelsLoadedRef.current &&
      !isProcessingRecognition &&
      !capturedImage
    ) {
      console.log("FaceCapture (Auth): Starting face detection interval.");
      detectionIntervalRef.current = setInterval(detectFace, 1500);
    } else {
      // console.log("FaceCapture (Auth): Conditions NOT met to start face detection interval.", { hasStream: !!stream, isModelLoading, modelsLoaded: modelsLoadedRef.current, isProcessingRecognition, hasCapturedImage: !!capturedImage });
    }

    return () => {
      clearDetectionInterval(); // Cleanup on effect change or unmount
    };
  }, [
    stream,
    isModelLoading,
    isProcessingRecognition,
    capturedImage,
    videoRef,
    canvasRef,
    captureImage,
    sendToFaceRecognition,
    clearDetectionInterval,
  ]);

  const handleRetake = () => {
    console.log("FaceCapture (Auth): Retake initiated.");
    setIsFaceDetectedState(false);
    setDetectionError(null);
    setIsProcessingRecognition(false);
    // modelsLoadedRef.current should persist, no need to reload models
    startCamera(); // This will also clear capturedImage via useCamera
  };

  const handleManualCaptureAndProcess = async () => {
    if (isModelLoading || !modelsLoadedRef.current) {
      setDetectionError("Detection models are still loading. Please wait.");
      return;
    }
    if (!isFaceDetectedState && stream && !capturedImage) {
      setDetectionError(
        "Please ensure your face is clearly visible for local detection first."
      );
      return;
    }
    console.log("FaceCapture (Auth): Manual capture initiated.");

    // If image already captured (e.g. after local detection), use it. Otherwise, capture new.
    const imageDataUrl = capturedImage || (stream ? captureImage() : null);

    if (imageDataUrl) {
      if (onCapture) {
        onCapture(imageDataUrl); // Propagate raw image if needed
      }
      await sendToFaceRecognition(imageDataUrl);
    } else if (!stream && !capturedImage) {
      setDetectionError("Camera not active. Please start camera or retake.");
    } else {
      // Stream active but captureImage failed (or no stream and no capturedImage)
      setDetectionError("Could not capture image. Please try again.");
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
              ? "Face ID login unavailable. Please use email and password."
              : "Face ID registration requires camera access."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-xs mx-auto rounded-xl overflow-hidden border border-border bg-card aspect-[3/4]">
        <CapturePreview
          stream={stream}
          capturedImage={capturedImage}
          videoRef={videoRef}
        />

        <canvas ref={canvasRef} className="hidden" />

        {isModelLoading && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1.5 rounded-md text-xs z-10">
            Loading detection models...
          </div>
        )}

        {detectionError && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-md text-xs z-10 w-11/12 text-center">
            {detectionError}
          </div>
        )}

        {isFaceDetectedState &&
          !isProcessingRecognition &&
          !capturedImage &&
          !isModelLoading &&
          !detectionError && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1.5 rounded-md text-xs z-10">
              Face Detected Locally
            </div>
          )}
        {isProcessingRecognition && !detectionError && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-xs z-10">
            Processing Recognition...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <CaptureControls
          hasStream={!!stream}
          hasImage={!!capturedImage}
          isProcessing={isProcessingRecognition || isModelLoading}
          onCapture={handleManualCaptureAndProcess}
          onRetake={handleRetake}
          mode={mode}
          isFaceDetected={isFaceDetectedState}
        />
      </div>
    </div>
  );
};

export default FaceCapture;
