'use client';

import React, { useEffect, useRef } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useFormAnalysis } from '@/hooks/useFormAnalysis';

interface PoseDetectionCameraProps {
  exercise: string;
  repNumber: number;
  onFormScoreUpdate?: (score: number) => void;
}

export function PoseDetectionCamera({
  exercise,
  repNumber,
  onFormScoreUpdate,
}: PoseDetectionCameraProps) {
  const {
    videoRef,
    isLoading,
    error,
    poseResult,
    isDetecting,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  } = usePoseDetection();

  const { coachFeedback, analyze } = useFormAnalysis();
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Start on mount
  useEffect(() => {
    startCamera();
    startDetection();

    return () => {
      stopDetection();
      stopCamera();
    };
  }, [startCamera, startDetection, stopCamera, stopDetection]);

  // Analyze form when pose updates
  useEffect(() => {
    if (poseResult && isDetecting) {
      // Debounce analysis (every 500ms)
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      analysisTimeoutRef.current = setTimeout(async () => {
        await analyze(exercise, poseResult, repNumber);
      }, 500);
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [poseResult, isDetecting, exercise, repNumber, analyze]);

  // Update parent when score changes
  useEffect(() => {
    if (coachFeedback && onFormScoreUpdate) {
      onFormScoreUpdate(coachFeedback.formScore);
    }
  }, [coachFeedback, onFormScoreUpdate]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">Kamera başlatılıyor...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {poseResult && (
        <SkeletonOverlay keypoints={poseResult.keypoints} />
      )}
    </div>
  );
}

function SkeletonOverlay({
  keypoints,
}: {
  keypoints: Array<{ name: string; x: number; y: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !keypoints) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw keypoints
    keypoints.forEach((kp) => {
      const x = kp.x * canvas.width;
      const y = kp.y * canvas.height;

      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw skeleton connections
    const connections = [
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
    ];

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startKp = keypoints.find((kp) => kp.name === start);
      const endKp = keypoints.find((kp) => kp.name === end);

      if (startKp && endKp) {
        ctx.beginPath();
        ctx.moveTo(startKp.x * canvas.width, startKp.y * canvas.height);
        ctx.lineTo(endKp.x * canvas.width, endKp.y * canvas.height);
        ctx.stroke();
      }
    });
  }, [keypoints]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      width={640}
      height={480}
    />
  );
}
