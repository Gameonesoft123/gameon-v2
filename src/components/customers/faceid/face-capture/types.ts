
export type FaceCaptureMode = 'register' | 'login'; // login for customer identification, register for new customer face_id

export interface FaceCaptureProps {
  onCapture?: (imageDataUrl: string) => void; // Optional: if parent wants raw image
  onFaceDetected?: (faceId: string) => void; // Returns the ExternalImageId (which is customer's face_id)
  mode: FaceCaptureMode;
  /** Required when mode is 'register'. This will be used as the ExternalImageId in AWS Rekognition and as the customer's face_id. */
  customerIdForRegistration?: string;
}
