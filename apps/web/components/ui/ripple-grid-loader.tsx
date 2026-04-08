'use client'

import React from 'react'

export function RippleGridLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="flex flex-wrap"
        style={{
          '--cell-size': '52px',
          '--cell-spacing': '1px',
          '--cells': '3',
          '--total-size': 'calc(3 * (52px + 2 * 1px))',
          width: 'calc(3 * (52px + 2 * 1px))',
          height: 'calc(3 * (52px + 2 * 1px))',
        } as React.CSSProperties}
      >
        {/* Grid cells with ripple animation */}
        {[
          { delay: '0ms', color: '#00FF87' },
          { delay: '100ms', color: '#0CFD95' },
          { delay: '200ms', color: '#17FBA2' },
          { delay: '100ms', color: '#23F9B2' },
          { delay: '200ms', color: '#30F7C3' },
          { delay: '200ms', color: '#3DF5D4' },
          { delay: '300ms', color: '#45F4DE' },
          { delay: '300ms', color: '#53F1F0' },
          { delay: '400ms', color: '#60EFFF' },
        ].map((cell, i) => (
          <div
            key={i}
            className="flex-shrink-0 m-0.5 rounded bg-transparent border-0"
            style={{
              width: '52px',
              height: '52px',
              flexBasis: '52px',
              animation: 'rippleAnimation 1.5s ease infinite',
              animationDelay: cell.delay,
              '--cell-color': cell.color,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <style>{`
        @keyframes rippleAnimation {
          0% {
            background-color: transparent;
          }
          30% {
            background-color: var(--cell-color);
          }
          60% {
            background-color: transparent;
          }
          100% {
            background-color: transparent;
          }
        }
      `}</style>
    </div>
  )
}
