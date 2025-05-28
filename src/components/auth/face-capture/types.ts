
export type FaceCaptureMode = 'register' | 'login'; // 'login' maps to 'identify'

export interface FaceCaptureProps {
  onCapture?: (imageDataUrl: string) => void; // For registration if raw image is needed by parent
  onFaceDetected?: (faceId: string) => void; // Callback with recognized/registered Face ID (ExternalImageId)
  mode: FaceCaptureMode;
  /** Required when mode is 'register'. This will be used as the ExternalImageId in AWS Rekognition. */
  externalImageIdForRegistration?: string;
}
