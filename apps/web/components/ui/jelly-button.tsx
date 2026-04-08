'use client'

import React from 'react'

export function JellyButton() {
  return (
    <div className="flex items-center justify-center p-8">
      <button
        className="relative w-[150px] h-14 rounded-full border-none bg-purple-500 text-white font-semibold cursor-pointer flex items-center justify-center transition-all duration-300 hover:animate-jello"
        style={{
          boxShadow: `
            inset 0px 10px 10px rgb(210, 187, 253),
            0px 5px 10px rgba(5, 5, 5, 0.212),
            inset 0px -10px 10px rgb(124, 54, 255)
          `,
        }}
      >
        {/* Top shine */}
        <div
          className="absolute top-[7px] w-[70%] h-0.5 bg-white rounded-full"
          style={{
            filter: 'blur(1px)',
            opacity: 0.678,
          }}
        />

        {/* Bottom shine */}
        <div
          className="absolute bottom-[7px] w-[70%] h-0.5 bg-white rounded-full"
          style={{
            filter: 'blur(1px)',
            opacity: 0.137,
          }}
        />

        {/* Button text */}
        <span>Jelly Button</span>
      </button>

      <style>{`
        @keyframes jello-horizontal {
          0% {
            transform: scale3d(1, 1, 1);
          }
          30% {
            transform: scale3d(1.25, 0.75, 1);
          }
          40% {
            transform: scale3d(0.75, 1.25, 1);
          }
          50% {
            transform: scale3d(1.15, 0.85, 1);
          }
          65% {
            transform: scale3d(0.95, 1.05, 1);
          }
          75% {
            transform: scale3d(1.05, 0.95, 1);
          }
          100% {
            transform: scale3d(1, 1, 1);
          }
        }

        button:hover {
          animation: jello-horizontal 0.9s both;
        }
      `}</style>
    </div>
  )
}
