"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface BodyTwin3DProps {
  formScore: number; // 0-100
  theme?: "light" | "dark";
}

export function BodyTwin3D({ formScore, theme = "light" }: BodyTwin3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodyMeshRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set background
    scene.background = new THREE.Color(
      theme === "light" ? 0xf5f5f5 : 0x1a1a1a
    );

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Create simplified human body geometry
    const bodyGroup = new THREE.Group();

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xff9999 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    bodyGroup.add(head);

    // Torso
    const torsoGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.y = 0.7;
    bodyGroup.add(torso);

    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0xff9999 });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.45, 0.7, 0);
    bodyGroup.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.45, 0.7, 0);
    bodyGroup.add(rightArm);

    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.15, 0.9, 0.15);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, -0.5, 0);
    bodyGroup.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, -0.5, 0);
    bodyGroup.add(rightLeg);

    scene.add(bodyGroup);
    bodyMeshRef.current = bodyGroup;

    // Update color based on form score
    const updateBodyColor = (score: number) => {
      let color: number;
      if (score < 50) {
        const ratio = score / 50;
        const r = Math.round(255);
        const g = Math.round(255 * ratio);
        color = (r << 16) | (g << 8) | 0;
      } else {
        const ratio = (score - 50) / 50;
        const r = Math.round(255 * (1 - ratio));
        const g = Math.round(255);
        color = (r << 16) | (g << 8) | 0;
      }

      bodyGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshPhongMaterial) {
            child.material.color.setHex(color);
          }
        }
      });
    };

    updateBodyColor(formScore);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      bodyGroup.rotation.y += 0.005;
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [theme]);

  // Update color when formScore changes
  useEffect(() => {
    if (!bodyMeshRef.current) return;

    let color: number;
    const score = Math.min(100, Math.max(0, formScore));

    if (score < 50) {
      const ratio = score / 50;
      const r = Math.round(255);
      const g = Math.round(255 * ratio);
      color = (r << 16) | (g << 8) | 0;
    } else {
      const ratio = (score - 50) / 50;
      const r = Math.round(255 * (1 - ratio));
      const g = Math.round(255);
      color = (r << 16) | (g << 8) | 0;
    }

    bodyMeshRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshPhongMaterial) {
          child.material.color.setHex(color);
        }
      }
    });
  }, [formScore]);

  return (
    <div
      ref={containerRef}
      className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
    />
  );
}
