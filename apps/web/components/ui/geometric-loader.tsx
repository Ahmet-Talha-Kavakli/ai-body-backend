'use client'

import React from 'react'

export function GeometricLoader() {
  return (
    <div className="relative w-28 h-28">
      {/* Box 1 */}
      <div className="absolute border-4 border-gray-200 box-border" />

      {/* Box 2 */}
      <div className="absolute border-4 border-gray-200 box-border" />

      {/* Box 3 */}
      <div className="absolute border-4 border-gray-200 box-border" />

      <style>{`
        div > div:nth-child(1) {
          width: 112px;
          height: 48px;
          margin-top: 64px;
          margin-left: 0px;
          animation: abox1 4s 1s forwards ease-in-out infinite;
        }

        div > div:nth-child(2) {
          width: 48px;
          height: 48px;
          margin-top: 0px;
          margin-left: 0px;
          animation: abox2 4s 1s forwards ease-in-out infinite;
        }

        div > div:nth-child(3) {
          width: 48px;
          height: 48px;
          margin-top: 0px;
          margin-left: 64px;
          animation: abox3 4s 1s forwards ease-in-out infinite;
        }

        @keyframes abox1 {
          0% {
            width: 112px;
            height: 48px;
            margin-top: 64px;
            margin-left: 0px;
          }
          12.5% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 0px;
          }
          25% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 0px;
          }
          37.5% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 0px;
          }
          50% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 0px;
          }
          62.5% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 0px;
          }
          75% {
            width: 48px;
            height: 112px;
            margin-top: 0px;
            margin-left: 0px;
          }
          87.5% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 0px;
          }
          100% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 0px;
          }
        }

        @keyframes abox2 {
          0% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 0px;
          }
          12.5% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 0px;
          }
          25% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 0px;
          }
          37.5% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 0px;
          }
          50% {
            width: 112px;
            height: 48px;
            margin-top: 0px;
            margin-left: 0px;
          }
          62.5% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 64px;
          }
          75% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 64px;
          }
          87.5% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 64px;
          }
          100% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 64px;
          }
        }

        @keyframes abox3 {
          0% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 64px;
          }
          12.5% {
            width: 48px;
            height: 48px;
            margin-top: 0px;
            margin-left: 64px;
          }
          25% {
            width: 48px;
            height: 112px;
            margin-top: 0px;
            margin-left: 64px;
          }
          37.5% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 64px;
          }
          50% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 64px;
          }
          62.5% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 64px;
          }
          75% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 64px;
          }
          87.5% {
            width: 48px;
            height: 48px;
            margin-top: 64px;
            margin-left: 64px;
          }
          100% {
            width: 112px;
            height: 48px;
            margin-top: 64px;
            margin-left: 0px;
          }
        }
      `}</style>
    </div>
  )
}
