'use client'

import React, { useState } from 'react'

export function JoinButton() {
  const [isClicked, setIsClicked] = useState(false)

  return (
    <button
      onClick={() => setIsClicked(!isClicked)}
      className="relative w-56 h-20 rounded-lg outline-none cursor-pointer text-2xl font-bold letter-spacing-tight border-0 bg-transparent transform -rotate-1 skew-x-1"
      style={{
        transform: 'rotate(353deg) skewX(4deg)',
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 rounded-lg blur-sm">
        <div
          className="absolute inset-0 rounded-2xl bg-purple-900 blur-lg transition-all duration-300"
          style={{
            boxShadow: `
              -7px 6px 0 0 rgba(115, 75, 155, 0.4),
              -14px 12px 0 0 rgba(115, 75, 155, 0.3),
              -21px 18px 4px 0 rgba(115, 75, 155, 0.25),
              -28px 24px 8px 0 rgba(115, 75, 155, 0.15),
              -35px 30px 12px 0 rgba(115, 75, 155, 0.12),
              -42px 36px 16px 0 rgba(115, 75, 155, 0.08),
              -56px 42px 20px 0 rgba(115, 75, 155, 0.05)
            `,
          }}
        />
      </div>

      {/* Wrap */}
      <div
        className="relative h-full rounded-lg overflow-hidden p-1 bg-gradient-to-b from-purple-200 to-purple-500 transition-all duration-300"
        style={{
          transform: 'translate(6px, -6px)',
        }}
      >
        {/* Path SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 221 42"
          height={42}
          width={221}
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            strokeDasharray: '150 480',
            strokeDashoffset: '150',
          }}
        >
          <path
            strokeLinecap="round"
            strokeWidth={3}
            stroke="#f4b1fd"
            d="M182.674 2H203C211.837 2 219 9.16344 219 18V24C219 32.8366 211.837 40 203 40H18C9.16345 40 2 32.8366 2 24V18C2 9.16344 9.16344 2 18 2H47.8855"
          />
        </svg>

        {/* Content */}
        <div
          className="relative flex items-center justify-center h-full gap-4 rounded-lg font-semibold bg-gradient-to-b from-purple-300 to-purple-400 pointer-events-none z-10 transition-all duration-300"
          style={{
            boxShadow: `
              inset -2px 12px 11px -5px #d190ff,
              inset 1px -3px 11px 0px rgba(0, 0, 0, 0.35)
            `,
          }}
        >
          {/* Shine Effect */}
          <div
            className="absolute inset-0 z-20 pointer-events-none opacity-70"
            style={{
              width: '80%',
              top: '45%',
              bottom: '35%',
              margin: 'auto',
              background: 'linear-gradient(to bottom, transparent, #8e26e2)',
              filter: 'brightness(1.3) blur(5px)',
            }}
          />

          {/* Text - Join Today */}
          <span className="relative z-30 flex items-center justify-center text-white text-shadow-sm drop-shadow">
            JoinToday
          </span>

          {/* Icon */}
          <div className="relative z-30 w-6 h-1 bg-white rounded-full animate-pulse" />

          {/* Text - Join Now */}
          <span className="absolute z-30 flex items-center justify-center text-white text-shadow-sm drop-shadow left-20">
            JoinNow
          </span>
        </div>
      </div>

      {/* Splash SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 342 208"
        height={208}
        width={342}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          transform: 'translate(-17%, -31%)',
          strokeDasharray: '60 60',
          strokeDashoffset: '60',
          stroke: '#c389f2',
        }}
      >
        <path strokeLinecap="round" strokeWidth={3} d="M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362" />
        <path strokeLinecap="round" strokeWidth={3} d="M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449" />
        <path strokeLinecap="round" strokeWidth={3} d="M230.578 57.4476C230.578 57.4476 225.785 41.5051 236.061 30.4998C246.337 19.4945 244.686 12.9998 244.686 12.9998" />
        <path strokeLinecap="round" strokeWidth={3} d="M230.578 150.528C230.578 150.528 225.785 166.471 236.061 177.476C246.337 188.481 244.686 194.976 244.686 194.976" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M170.392 57.0278C170.392 57.0278 173.89 42.1322 169.571 29.54C165.252 16.9478 168.751 2.05227 168.751 2.05227" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M170.392 150.948C170.392 150.948 173.89 165.844 169.571 178.436C165.252 191.028 168.751 205.924 168.751 205.924" />
        <path strokeLinecap="round" strokeWidth={3} d="M112.609 57.4476C112.609 57.4476 117.401 41.5051 107.125 30.4998C96.8492 19.4945 98.5 12.9998 98.5 12.9998" />
        <path strokeLinecap="round" strokeWidth={3} d="M112.609 150.528C112.609 150.528 117.401 166.471 107.125 177.476C96.8492 188.481 98.5 194.976 98.5 194.976" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M62.2941 64.9917C62.2941 64.9917 55.4671 49.8089 40.4932 48.2295C25.5194 46.6501 23.7159 36.5272 23.7159 36.5272" />
        <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M62.2941 145.984C62.2941 145.984 55.4671 161.167 40.4932 162.746C25.5194 164.326 23.7159 174.449 23.7159 174.449" />
      </svg>

      <style>{`
        @keyframes charAppear {
          0% {
            transform: translateY(50%);
            opacity: 0;
            filter: blur(20px);
          }
          20% {
            transform: translateY(70%);
            opacity: 1;
          }
          50% {
            transform: translateY(-15%);
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes splash {
          to {
            stroke-dasharray: 2 60;
            stroke-dashoffset: -60;
          }
        }

        button:hover {
          transform: translate(8px, -8px) !important;
        }

        button:active {
          animation: splash 0.8s cubic-bezier(0.3, 0, 0, 1) forwards 0.05s;
        }

        button:active svg {
          animation: splash 0.8s cubic-bezier(0.3, 0, 0, 1) forwards 0.05s;
        }
      `}</style>
    </button>
  )
}
