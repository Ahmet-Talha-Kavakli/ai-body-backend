'use client';

import { useEffect, useRef } from 'react';

export function AuroraBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      t += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Indigo blob
      const g1 = ctx.createRadialGradient(
        canvas.width * (0.3 + Math.sin(t) * 0.1),
        canvas.height * (0.3 + Math.cos(t * 0.7) * 0.1),
        0,
        canvas.width * 0.3, canvas.height * 0.3,
        canvas.width * 0.5
      );
      g1.addColorStop(0, 'rgba(99,102,241,0.15)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Purple blob
      const g2 = ctx.createRadialGradient(
        canvas.width * (0.7 + Math.cos(t * 0.9) * 0.1),
        canvas.height * (0.7 + Math.sin(t * 0.6) * 0.1),
        0,
        canvas.width * 0.7, canvas.height * 0.7,
        canvas.width * 0.4
      );
      g2.addColorStop(0, 'rgba(139,92,246,0.1)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className || ''}`}
    />
  );
}
