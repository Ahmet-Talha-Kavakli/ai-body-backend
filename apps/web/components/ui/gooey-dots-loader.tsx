'use client'

import React from 'react'

export function GooeyDotsLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-full h-full">
        {/* SVG Filter definitions */}
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="goo">
              <feGaussianBlur result="blur" stdDeviation={10} in="SourceGraphic" />
              <feColorMatrix
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
                mode="matrix"
                in="blur"
              />
            </filter>
          </defs>
        </svg>

        {/* Container with dots */}
        <div
          className="absolute top-1/2 left-1/2 w-[200px] h-[200px] -translate-x-1/2 -translate-y-1/2"
          style={{
            filter: 'url("#goo")',
            animation: 'rotateMoveLoader 2s ease-in-out infinite',
          }}
        >
          {/* Dot 1 - Yellow */}
          <div
            className="absolute w-[70px] h-[70px] rounded-full bg-yellow-400 m-auto inset-0"
            style={{
              animation: 'dot1Move 2s ease infinite, indexLayer 6s ease -2s infinite',
            }}
          />

          {/* Dot 2 - Blue */}
          <div
            className="absolute w-[70px] h-[70px] rounded-full bg-blue-600 m-auto inset-0"
            style={{
              animation: 'dot2Move 2s ease infinite, indexLayer 6s ease -4s infinite',
            }}
          />

          {/* Dot 3 - Red */}
          <div
            className="absolute w-[70px] h-[70px] rounded-full bg-red-600 m-auto inset-0"
            style={{
              animation: 'dot3Move 2s ease infinite, indexLayer 6s ease infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes dot3Move {
          20% {
            transform: scale(1);
          }
          45% {
            transform: translateY(-18px) scale(0.45);
          }
          60% {
            transform: translateY(-90px) scale(0.45);
          }
          80% {
            transform: translateY(-90px) scale(0.45);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes dot2Move {
          20% {
            transform: scale(1);
          }
          45% {
            transform: translate(-16px, 12px) scale(0.45);
          }
          60% {
            transform: translate(-80px, 60px) scale(0.45);
          }
          80% {
            transform: translate(-80px, 60px) scale(0.45);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes dot1Move {
          20% {
            transform: scale(1);
          }
          45% {
            transform: translate(16px, 12px) scale(0.45);
          }
          60% {
            transform: translate(80px, 60px) scale(0.45);
          }
          80% {
            transform: translate(80px, 60px) scale(0.45);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes rotateMoveLoader {
          55% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          80% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes indexLayer {
          0%,
          100% {
            z-index: 3;
          }
          33.3% {
            z-index: 2;
          }
          66.6% {
            z-index: 1;
          }
        }
      `}</style>
    </div>
  )
}
