'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface BodyTwinProps {
  formScore?: number;
  injuryMarkers?: { location: string; severity: 'low' | 'medium' | 'high' }[];
  className?: string;
}

export function BodyTwin({ formScore = 100, injuryMarkers = [], className }: BodyTwinProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Stub: Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    // Stub: Add body geometry and materials based on form score
    // Stub: Apply injury markers with color/intensity
    // Stub: Render animation loop

    return () => {
      // Cleanup renderer
      renderer.dispose();
    };
  }, [formScore, injuryMarkers]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '400px', position: 'relative' }}
    >
      <div className="text-center text-gray-500">
        Body Twin 3D Visualization (Form Score: {formScore}%)
      </div>
    </div>
  );
}

export default BodyTwin;
