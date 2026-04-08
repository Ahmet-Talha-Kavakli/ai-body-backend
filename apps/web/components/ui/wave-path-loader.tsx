'use client'

import React from 'react'

export function WavePathLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-[400px] h-[200px]">
        {/* Sharp wave */}
        <svg
          className="absolute w-full"
          viewBox="0 0 400 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,25 C150,110 150, -60 300,25"
            stroke="#ff0092"
            strokeWidth="50"
            strokeLinecap="round"
            style={{
              transform: 'translate(50px, 50%)',
              animation: 'waveAnimate 2s ease-in-out infinite',
            }}
          />
        </svg>

        {/* Blurred wave */}
        <svg
          className="absolute w-full"
          viewBox="0 0 400 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'blur(40px)',
          }}
        >
          <path
            d="M0,25 C150,110 150, -60 300,25"
            stroke="#ff0092"
            strokeWidth="50"
            strokeLinecap="round"
            style={{
              transform: 'translate(50px, 50%)',
              animation: 'waveAnimate 2s ease-in-out infinite',
            }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes waveAnimate {
          0% {
            stroke: #ff0092;
            d: path("M0,25 C150,110 150, -60 300,25");
          }
          50% {
            stroke: #00ff00;
            d: path("M0,25 C160,-50 140, 110 300,25");
          }
          100% {
            stroke: #ff0092;
            d: path("M0,25 C150,110 150, -60 300,25");
          }
        }
      `}</style>
    </div>
  )
}
