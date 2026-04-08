'use client'

import React, { useState } from 'react'

export function NeonCheckbox() {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <label className="group relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => setIsChecked(e.target.checked)}
        className="hidden"
      />

      <div className="relative h-full w-full">
        {/* Main Box */}
        <div
          className={`absolute inset-0 rounded-sm border-2 bg-black/80 transition-all duration-400 ${
            isChecked
              ? 'border-cyan-400 bg-cyan-400/10 hover:scale-100'
              : 'border-cyan-700 hover:scale-105'
          }`}
        >
          {/* Check Mark */}
          <div className="absolute inset-0.5 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className={`h-4/5 w-4/5 fill-none stroke-cyan-400 stroke-[3px] transition-all duration-400 ${
                isChecked
                  ? 'scale-110 [stroke-dashoffset:0]'
                  : '[stroke-dasharray:40] [stroke-dashoffset:40]'
              }`}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3,12.5l7,7L21,5" />
            </svg>
          </div>

          {/* Glow */}
          <div
            className={`absolute -inset-0.5 rounded-md bg-cyan-400 blur-lg transition-all duration-400 ${
              isChecked ? 'opacity-20' : 'opacity-0'
            }`}
          />

          {/* Borders */}
          <div className="absolute inset-0 overflow-hidden rounded-sm">
            {isChecked && (
              <>
                <span
                  className="absolute top-0 left-0 h-px w-10 bg-cyan-400 animation-borderFlow1"
                  style={{ animation: 'borderFlow1 2s linear infinite' }}
                />
                <span
                  className="absolute right-0 top-0 w-px h-10 bg-cyan-400 animation-borderFlow2"
                  style={{ animation: 'borderFlow2 2s linear infinite' }}
                />
                <span
                  className="absolute bottom-0 right-0 h-px w-10 bg-cyan-400 animation-borderFlow3"
                  style={{ animation: 'borderFlow3 2s linear infinite' }}
                />
                <span
                  className="absolute left-0 bottom-0 w-px h-10 bg-cyan-400 animation-borderFlow4"
                  style={{ animation: 'borderFlow4 2s linear infinite' }}
                />
              </>
            )}
          </div>
        </div>

        {/* Effects Container */}
        <div className="pointer-events-none absolute inset-0">
          {/* Particles */}
          <div className="absolute inset-0">
            {isChecked &&
              [
                { x: 25, y: -25 },
                { x: -25, y: -25 },
                { x: 25, y: 25 },
                { x: -25, y: 25 },
                { x: 35, y: 0 },
                { x: -35, y: 0 },
                { x: 0, y: 35 },
                { x: 0, y: -35 },
                { x: 20, y: -30 },
                { x: -20, y: 30 },
                { x: 30, y: 20 },
                { x: -30, y: -20 },
              ].map((particle, i) => (
                <span
                  key={`particle-${i}`}
                  className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#00ffaa]"
                  style={{
                    animation: `particleExplosion 0.6s ease-out forwards`,
                    '--x': `${particle.x}px`,
                    '--y': `${particle.y}px`,
                  } as any}
                />
              ))}
          </div>

          {/* Rings */}
          <div className="absolute -inset-5">
            {isChecked &&
              [0, 1, 2].map((i) => (
                <div
                  key={`ring-${i}`}
                  className="absolute inset-0 rounded-full border border-cyan-400"
                  style={{
                    animation: `ringPulse 0.6s ease-out forwards`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
          </div>

          {/* Sparks */}
          <div className="absolute inset-0">
            {isChecked &&
              [0, 90, 180, 270].map((rotation, i) => (
                <span
                  key={`spark-${i}`}
                  className="absolute left-1/2 top-1/2 h-px w-5 bg-gradient-to-r from-cyan-400 to-transparent"
                  style={{
                    animation: `sparkFlash 0.6s ease-out forwards`,
                    '--r': `${rotation}deg`,
                    transform: `rotate(${rotation}deg)`,
                  } as any}
                />
              ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes borderFlow1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(200%); }
        }

        @keyframes borderFlow2 {
          0% { transform: translateY(0); }
          100% { transform: translateY(200%); }
        }

        @keyframes borderFlow3 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-200%); }
        }

        @keyframes borderFlow4 {
          0% { transform: translateY(0); }
          100% { transform: translateY(-200%); }
        }

        @keyframes particleExplosion {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + var(--x, 20px)),
              calc(-50% + var(--y, 20px))
            ) scale(0);
            opacity: 0;
          }
        }

        @keyframes ringPulse {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes sparkFlash {
          0% {
            transform: rotate(var(--r, 0deg)) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--r, 0deg)) translateX(30px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </label>
  )
}
