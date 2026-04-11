'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { PoseDetectionResult } from '@/lib/ai/pose-detection';
import { loadSkeletonModel } from '@/lib/ar/skeleton-loader';
import { updateSkeletonPose, calculateBoneLength, BONE_MAPPINGS } from '@/lib/ar/keypoint-mapper';
import { createHeatMapShader, updateShaderTime, getColorForSeverity } from '@/lib/ar/heat-map-shader';

export interface SkeletonViewer3DProps {
  poseResult: PoseDetectionResult | null;
  injuries?: Array<{ bodyPart: string; severity: string }>;
  width?: number;
  height?: number;
}

export function SkeletonViewer3D({
  poseResult,
  injuries = [],
  width = 800,
  height = 600,
}: SkeletonViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const skeletonRef = useRef<THREE.Group | null>(null);
  const bonesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 2.5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);

      const skeletonGroup = new THREE.Group();
      scene.add(skeletonGroup);
      skeletonRef.current = skeletonGroup;

      (async () => {
        const model = await loadSkeletonModel();
        if (model && skeletonRef.current) {
          skeletonRef.current.add(model.scene);
          createBoneMeshes();
          setIsLoading(false);
        } else {
          setError('Skeleton model failed to load');
        }
      })();

      const clock = new THREE.Clock();
      let animationId: number;

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        if (skeletonRef.current) {
          skeletonRef.current.rotation.y += 0.002;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationId);
        if (renderer && containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Scene initialization error:', err);
      return undefined;
    }
  }, [width, height]);

  const createBoneMeshes = () => {
    if (!skeletonRef.current) return;

    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const material = createHeatMapShader();

    Object.keys(BONE_MAPPINGS).forEach((boneName) => {
      const mesh = new THREE.Mesh(geometry, material);
      skeletonRef.current?.add(mesh);
      bonesRef.current.set(boneName, mesh);
    });
  };

  useEffect(() => {
    if (!skeletonRef.current || !poseResult) return;

    const boneTransforms = updateSkeletonPose(skeletonRef.current, poseResult);

    boneTransforms.forEach((transform) => {
      const boneMesh = bonesRef.current.get(transform.boneName);
      if (!boneMesh || transform.visibility < 0.3) return;

      boneMesh.visible = true;
      boneMesh.position.copy(transform.position);

      const boneLength = calculateBoneLength(transform.startPoint, transform.endPoint);
      boneMesh.scale.z = boneLength;

      const injuryForBone = injuries.find(inj =>
        transform.boneName.includes(inj.bodyPart.toLowerCase())
      );

      if (injuryForBone) {
        const severityMap: Record<string, number> = { mild: 0.3, moderate: 0.6, severe: 0.9 };
        const severity = severityMap[injuryForBone.severity] || 0.5;
        const color = getColorForSeverity(severity);
        const material = boneMesh.material as THREE.ShaderMaterial;
        if (material.uniforms?.severity) {
          material.uniforms.severity.value = severity;
        }
      }
    });
  }, [poseResult, injuries]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        background: '#1a1a2e',
      }}
    >
      {isLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff' }}>
          Loading...
        </div>
      )}
      {error && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ff6b6b' }}>Error: {error}</div>}
    </div>
  );
}
