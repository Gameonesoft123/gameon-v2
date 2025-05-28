import { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { toast } from 'sonner';

interface UseFaceMeshProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onFaceDetected: () => void;
    onError: (error: string) => void;
}

const FACE_DETECTION_TIMEOUT = 10000; // 10 seconds
const MIN_CONFIDENCE = 0.5;
const DETECTION_INTERVAL = 100; // 100ms

export const useFaceMesh = ({
    videoRef,
    canvasRef,
    onFaceDetected,
    onError
}: UseFaceMeshProps) => {
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const detectionIntervalRef = useRef<NodeJS.Timeout>();
    const timeoutRef = useRef<NodeJS.Timeout>();

    const detectFace = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        try {
            const detections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();

            if (detections.length > 0) {
                const detection = detections[0];

                // Check if face detection confidence is high enough
                if (detection.detection.score >= MIN_CONFIDENCE) {
                    // Check if the face is looking at the camera (neutral expression)
                    const expression = detection.expressions.asSortedArray()[0];
                    if (expression.expression === 'neutral' && expression.probability > 0.5) {
                        setIsFaceDetected(true);
                        onFaceDetected();
                        stopFaceDetection();
                    }
                }
            } else {
                setIsFaceDetected(false);
            }
        } catch (error) {
            onError('Error detecting face');
            stopFaceDetection();
        }
    };

    const startFaceDetection = () => {
        // Clear any existing intervals
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        // Start face detection interval
        detectionIntervalRef.current = setInterval(detectFace, DETECTION_INTERVAL);

        // Set timeout to stop detection if no face is found
        timeoutRef.current = setTimeout(() => {
            if (!isFaceDetected) {
                onError('No face detected within timeout period');
                stopFaceDetection();
            }
        }, FACE_DETECTION_TIMEOUT);
    };

    const stopFaceDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsFaceDetected(false);
    };

    useEffect(() => {
        return () => {
            stopFaceDetection();
        };
    }, []);

    return {
        isFaceDetected,
        startFaceDetection,
        stopFaceDetection
    };
}; 