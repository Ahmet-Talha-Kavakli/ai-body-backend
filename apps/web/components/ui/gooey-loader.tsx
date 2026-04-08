'use client'

import React from 'react'

export function GooeyLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div>
        {/* SVG Filter definitions */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={12} />
            <feColorMatrix
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 48 -7"
            />
          </filter>
        </svg>

        {/* Loader container */}
        <div
          className="relative w-[12em] h-[3em] overflow-hidden border-b-8 border-black"
          style={{
            filter: 'url(#goo)',
          }}
        >
          {/* Red blob */}
          <div
            className="absolute w-[22em] h-[18em] rounded-full bg-red-600"
            style={{
              left: '-2em',
              bottom: '-18em',
              animation: 'gooeyWave1 2s linear infinite',
            }}
          />

          {/* Cyan blob */}
          <div
            className="absolute w-[16em] h-[12em] rounded-full bg-cyan-400"
            style={{
              left: '-4em',
              bottom: '-12em',
              animation: 'gooeyWave2 2s linear infinite 0.75s',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes gooeyWave1 {
          0% {
            transform: translateX(-10em) rotate(0deg);
          }
          100% {
            transform: translateX(7em) rotate(180deg);
          }
        }

        @keyframes gooeyWave2 {
          0% {
            transform: translateX(-8em) rotate(0deg);
          }
          100% {
            transform: translateX(8em) rotate(180deg);
          }
        }
      `}</style>
    </div>
  )
}
