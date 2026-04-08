'use client'

import React from 'react'

export function NewtonsCradle() {
  return (
    <div className="flex items-center justify-center w-12 h-12">
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Dot 1 */}
        <div
          className="relative flex items-center h-full w-1/4"
          style={{
            transformOrigin: 'center top',
            animation: 'swing 1.2s linear infinite',
          }}
        >
          <div className="w-full h-1/4 rounded-full bg-gray-600" />
        </div>

        {/* Dot 2 */}
        <div
          className="relative flex items-center h-full w-1/4"
          style={{
            transformOrigin: 'center top',
          }}
        >
          <div className="w-full h-1/4 rounded-full bg-gray-600" />
        </div>

        {/* Dot 3 */}
        <div
          className="relative flex items-center h-full w-1/4"
          style={{
            transformOrigin: 'center top',
          }}
        >
          <div className="w-full h-1/4 rounded-full bg-gray-600" />
        </div>

        {/* Dot 4 */}
        <div
          className="relative flex items-center h-full w-1/4"
          style={{
            transformOrigin: 'center top',
            animation: 'swing2 1.2s linear infinite',
          }}
        >
          <div className="w-full h-1/4 rounded-full bg-gray-600" />
        </div>
      </div>

      <style>{`
        @keyframes swing {
          0% {
            transform: rotate(0deg);
            animation-timing-function: ease-out;
          }
          25% {
            transform: rotate(70deg);
            animation-timing-function: ease-in;
          }
          50% {
            transform: rotate(0deg);
            animation-timing-function: linear;
          }
          100% {
            transform: rotate(0deg);
            animation-timing-function: linear;
          }
        }

        @keyframes swing2 {
          0% {
            transform: rotate(0deg);
            animation-timing-function: linear;
          }
          50% {
            transform: rotate(0deg);
            animation-timing-function: ease-out;
          }
          75% {
            transform: rotate(-70deg);
            animation-timing-function: ease-in;
          }
          100% {
            transform: rotate(0deg);
            animation-timing-function: linear;
          }
        }
      `}</style>
    </div>
  )
}
