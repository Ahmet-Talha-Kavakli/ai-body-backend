'use client'

import React from 'react'

export function GradientHoverButton() {
  return (
    <div className="flex items-center justify-center p-8">
      <button
        className="relative inline-flex h-14 items-center rounded-full px-8 font-segoe text-xl font-bold text-gray-800 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(255, 208, 116)',
        }}
      >
        {/* Background layers container */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl"
          style={{
            transform: 'scale(1)',
            transition: 'transform 1.8s cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        >
          {/* Animated gradient layers */}
          <div
            className="absolute top-[-60%] left-1/2 aspect-square w-[max(200%,10rem)]"
            style={{
              transform: 'translate(-50%)',
            }}
          >
            {/* Purple layer */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'rgba(163, 116, 255)',
                transform: 'scale(0)',
                transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)',
              }}
            />

            {/* Turquoise layer */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'rgba(23, 241, 209)',
                transform: 'scale(0)',
                transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)',
                transitionDelay: '0.1s',
              }}
            />

            {/* Yellow layer */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 208, 116)',
                transform: 'scale(0)',
                transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)',
                transitionDelay: '0.2s',
              }}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="relative pointer-events-none">
          {/* Static text */}
          <span
            className="block transition-all duration-300"
            style={{
              transform: 'translateY(0)',
              opacity: 1,
            }}
          >
            Hover me
          </span>

          {/* Hover text */}
          <span
            className="absolute top-0 left-0 block transition-all duration-300"
            style={{
              transform: 'translateY(70%)',
              opacity: 0,
            }}
          >
            Hover me
          </span>
        </div>

        <style>{`
          button:hover > div:first-child {
            transform: scale(1.1);
          }

          button:hover > div:first-child > div:nth-child(1) {
            transform: scale(1) !important;
          }

          button:hover > div:first-child > div:nth-child(2) {
            transform: scale(1) !important;
          }

          button:hover > div:first-child > div:nth-child(3) {
            transform: scale(1) !important;
          }

          button:hover > div:last-child > span:first-child {
            opacity: 0;
            transform: translateY(-70%);
          }

          button:hover > div:last-child > span:last-child {
            opacity: 1;
            transform: translateY(0);
          }
        `}</style>
      </button>
    </div>
  )
}
