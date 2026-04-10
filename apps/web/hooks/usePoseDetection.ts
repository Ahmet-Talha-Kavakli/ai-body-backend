// apps/web/hooks/usePoseDetection.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initializePoseDetection,
  detectPose,
  closePoseDetection,
  PoseDetectionResult,
} from '@/lib/ai/pose-detection';

export function usePoseDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(
    null
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const animationFrameRef = useRef<number>();

  // Initialize pose detection
  useEffect(() => {
    initializePoseDetection()
      .then(() => setIsLoading(false))
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });

    return () => closePoseDetection();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Detection loop
  const startDetection = useCallback(() => {
    setIsDetecting(true);

    const detect = () => {
      if (videoRef.current && !isLoading) {
        const result = detectPose(videoRef.current);
        if (result) {
          setPoseResult(result);
        }
      }

      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  }, [isLoading, isDetecting]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return {
    videoRef,
    isLoading,
    error,
    poseResult,
    isDetecting,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  };
}
