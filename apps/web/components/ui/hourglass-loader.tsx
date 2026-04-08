'use client'

import React from 'react'

export function HourglassLoader() {
  return (
    <div className="relative bg-gray-700 h-[130px] w-[130px] rounded-full mx-auto my-[30px]">
      {/* Hourglass Container */}
      <div
        className="absolute top-[30px] left-[40px] w-[50px] h-[70px]"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {/* Top Cap */}
        <div
          className="absolute top-0 w-full"
          style={{ transformStyle: 'preserve-3d' }}
        />

        {/* Top Glass */}
        <div
          className="absolute top-[-16px] left-[3px] rounded-full w-[44px] h-[44px] bg-gray-500"
          style={{ transform: 'rotateX(90deg)' }}
        />

        {/* Sand Stream */}
        <div className="absolute w-[3px]" style={{ left: '24px' }} />

        {/* Center Glass */}
        <div
          className="absolute top-[32px] left-[20px] w-[10px] h-[6px] bg-gray-500 opacity-50"
          style={{ perspective: '100px' }}
        >
          {/* Glass top cone */}
          <div
            className="absolute top-[-27px] left-[-17px] w-[44px] h-[28px] bg-gray-500"
            style={{ borderRadius: '0 0 25px 25px' }}
          />
          {/* Glass bottom cone */}
          <div
            className="absolute bottom-[-27px] left-[-17px] w-[44px] h-[28px] bg-gray-500"
            style={{ borderRadius: '25px 25px 0 0' }}
          />
        </div>

        {/* Bottom Cap */}
        <div
          className="absolute bottom-0 w-full"
          style={{ transformStyle: 'preserve-3d' }}
        />

        {/* Bottom Glass */}
        <div className="absolute bottom-0 w-full" />

        {/* Curves */}
        <div className="absolute top-[32px] left-[15px] w-[6px] h-[6px] rounded-full bg-gray-900" />
        <div className="absolute top-[32px] left-[29px] w-[6px] h-[6px] rounded-full bg-gray-900" />

        {/* Sand */}
        <div className="absolute top-[8px] left-[6px] w-[39px]" style={{ borderRadius: '3px 3px 30px 30px' }} />
        <div className="absolute left-[6px]" style={{ borderRadius: '30px 30px 3px 3px' }} />
      </div>

      <style>{`
        @keyframes hourglassRotate {
          0% {
            transform: rotateX(0deg);
          }
          50% {
            transform: rotateX(180deg);
          }
          100% {
            transform: rotateX(180deg);
          }
        }

        @keyframes hideCurves {
          0% {
            opacity: 1;
          }
          25% {
            opacity: 0;
          }
          30% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes sandStream1 {
          0% {
            height: 0;
            top: 35px;
          }
          50% {
            height: 0;
            top: 45px;
          }
          60% {
            height: 35px;
            top: 8px;
          }
          85% {
            height: 35px;
            top: 8px;
          }
          100% {
            height: 0;
            top: 8px;
          }
        }

        @keyframes sandStream2 {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0;
          }
          51% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          91% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes sandFillup {
          0% {
            opacity: 0;
            height: 0;
          }
          60% {
            opacity: 1;
            height: 0;
          }
          100% {
            opacity: 1;
            height: 17px;
          }
        }

        @keyframes sandDeplete {
          0% {
            opacity: 0;
            top: 45px;
            height: 17px;
            width: 38px;
            left: 6px;
          }
          1% {
            opacity: 1;
            top: 45px;
            height: 17px;
            width: 38px;
            left: 6px;
          }
          24% {
            opacity: 1;
            top: 45px;
            height: 17px;
            width: 38px;
            left: 6px;
          }
          25% {
            opacity: 1;
            top: 41px;
            height: 17px;
            width: 38px;
            left: 6px;
          }
          50% {
            opacity: 1;
            top: 41px;
            height: 17px;
            width: 38px;
            left: 6px;
          }
          90% {
            opacity: 1;
            top: 41px;
            height: 0;
            width: 10px;
            left: 20px;
          }
        }

        div[style*="perspective"] {
          animation: hourglassRotate 2s ease-in 0s infinite;
        }

        div[style*="left: 15px"] {
          animation: hideCurves 2s ease-in 0s infinite;
        }

        div[style*="left: 29px"] {
          animation: hideCurves 2s ease-in 0s infinite;
        }
      `}</style>
    </div>
  )
}
