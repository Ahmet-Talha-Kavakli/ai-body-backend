'use client'

import React from 'react'

export function ScrollDownIndicator() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="relative w-[30px] h-[50px] border-2 border-sky-400 rounded-full mb-4 cursor-pointer"
        style={{
          '--color': 'rgb(135, 206, 235)',
        } as React.CSSProperties}
      >
        {/* Scrolling dot */}
        <div
          className="absolute w-1.5 h-1.5 bg-sky-400 rounded-full"
          style={{
            bottom: '30px',
            left: '50%',
            marginLeft: '-3px',
            animation: 'scrolldown-anim 2s infinite',
            boxShadow: '0px -5px 3px 1px rgba(42, 84, 112, 0.4)',
          }}
        />

        {/* Chevrons container */}
        <div className="absolute top-[48px] left-1/2 transform -translate-x-1.5 w-[30px] flex flex-col items-center">
          {/* First Chevron */}
          <div
            className="w-2.5 h-2.5 border-r-[3px] border-b-[3px] border-sky-400"
            style={{
              transform: 'rotate(45deg)',
              marginTop: '-6px',
              animation: 'pulse54012 500ms ease-in-out infinite alternate',
            }}
          />

          {/* Second Chevron */}
          <div
            className="w-2.5 h-2.5 border-r-[3px] border-b-[3px] border-sky-400"
            style={{
              transform: 'rotate(45deg)',
              marginTop: '-6px',
              animation: 'pulse54012 500ms ease-in-out infinite alternate',
              animationDelay: '250ms',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrolldown-anim {
          0% {
            opacity: 0;
            height: 6px;
          }
          40% {
            opacity: 1;
            height: 10px;
          }
          80% {
            transform: translate(0, 20px);
            height: 10px;
            opacity: 0;
          }
          100% {
            height: 3px;
            opacity: 0;
          }
        }

        @keyframes pulse54012 {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
