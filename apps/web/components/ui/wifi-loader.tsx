'use client'

import React from 'react'

export function WifiLoader() {
  return (
    <div className="relative w-16 h-16 rounded-full flex items-center justify-center">
      {/* Outer Circle */}
      <svg className="absolute w-24 h-24" viewBox="0 0 86 86">
        <circle
          className="fill-none stroke-gray-300 stroke-[6px]"
          cx={43}
          cy={43}
          r={40}
          style={{
            transform: 'rotate(-100deg)',
            transformOrigin: 'center',
            strokeDasharray: '62.75 188.25',
            animation: 'circle-outer 1.8s ease infinite 0.3s',
          }}
        />
        <circle
          className="fill-none stroke-blue-600 stroke-[6px]"
          cx={43}
          cy={43}
          r={40}
          style={{
            transform: 'rotate(-100deg)',
            transformOrigin: 'center',
            strokeDasharray: '62.75 188.25',
            animation: 'circle-outer 1.8s ease infinite 0.15s',
          }}
        />
      </svg>

      {/* Middle Circle */}
      <svg className="absolute w-16 h-16" viewBox="0 0 60 60">
        <circle
          className="fill-none stroke-gray-300 stroke-[6px]"
          cx={30}
          cy={30}
          r={27}
          style={{
            transform: 'rotate(-100deg)',
            transformOrigin: 'center',
            strokeDasharray: '42.5 127.5',
            animation: 'circle-middle 1.8s ease infinite 0.25s',
          }}
        />
        <circle
          className="fill-none stroke-blue-600 stroke-[6px]"
          cx={30}
          cy={30}
          r={27}
          style={{
            transform: 'rotate(-100deg)',
            transformOrigin: 'center',
            strokeDasharray: '42.5 127.5',
            animation: 'circle-middle 1.8s ease infinite 0.1s',
          }}
        />
      </svg>

      {/* Inner Circle */}
      <svg className="absolute w-10 h-10" viewBox="0 0 34 34">
        <circle
          className="fill-none stroke-gray-300 stroke-[6px]"
          cx={17}
          cy={17}
          r={14}
          style={{
            transform: 'rotate(-100deg)',
            transformOrigin: 'center',
            strokeDasharray: '22 66',
            animation: 'circle-inner 1.8s ease infinite 0.2s',
          }}
        />
        <circle
          className="fill-none stroke-blue-600 stroke-[6px]"
          cx={17}
          cy={17}
          r={14}
          style={{
            transform: 'rotate(-100deg)',
            transformOrigin: 'center',
            strokeDasharray: '22 66',
            animation: 'circle-inner 1.8s ease infinite 0.05s',
          }}
        />
      </svg>

      {/* Text */}
      <div className="absolute top-full mt-8 text-center">
        <div className="relative h-5">
          <span className="text-gray-700 text-sm font-medium lowercase tracking-wide">
            Searching
          </span>
          <span
            className="absolute left-0 text-blue-600 text-sm font-medium lowercase tracking-wide"
            style={{
              animation: 'text-animation 3.6s ease infinite',
            }}
          >
            Searching
          </span>
        </div>
      </div>

      <style>{`
        @keyframes circle-outer {
          0% {
            stroke-dashoffset: 25;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 301;
          }
          80% {
            stroke-dashoffset: 276;
          }
          100% {
            stroke-dashoffset: 276;
          }
        }

        @keyframes circle-middle {
          0% {
            stroke-dashoffset: 17;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 204;
          }
          80% {
            stroke-dashoffset: 187;
          }
          100% {
            stroke-dashoffset: 187;
          }
        }

        @keyframes circle-inner {
          0% {
            stroke-dashoffset: 9;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 106;
          }
          80% {
            stroke-dashoffset: 97;
          }
          100% {
            stroke-dashoffset: 97;
          }
        }

        @keyframes text-animation {
          0% {
            clip-path: inset(0 100% 0 0);
          }
          50% {
            clip-path: inset(0);
          }
          100% {
            clip-path: inset(0 0 0 100%);
          }
        }
      `}</style>
    </div>
  )
}
