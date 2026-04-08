'use client'

import React, { useState } from 'react'

export function TransactionCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-white rounded-lg transition-all duration-300 cursor-pointer ${
        isHovered ? 'scale-103 w-56' : 'w-96'
      } h-32`}
    >
      {/* Left Side - Green Card */}
      <div
        className={`bg-emerald-400 w-32 h-32 rounded-lg relative flex justify-center items-center flex-shrink-0 overflow-hidden transition-all duration-300 ${
          isHovered ? 'w-full' : ''
        }`}
      >
        {/* Card */}
        <div className={`absolute w-16 h-12 bg-lime-300 rounded-lg flex flex-col items-center z-10 transition-all duration-1000 ${
          isHovered ? '-translate-y-20 rotate-90' : 'translate-y-0'
        }`}
          style={{
            animation: isHovered ? 'slide-top 1.2s cubic-bezier(0.645, 0.045, 0.355, 1) both' : 'none'
          }}
        >
          <div className="w-14 h-3 bg-green-500 rounded-sm mt-2" />
          <div className="w-2 h-2 bg-green-700 rounded-full mt-2 shadow-lg"
            style={{
              boxShadow: '0 -10px 0 0 rgb(38, 133, 14), 0 10px 0 0 rgb(86, 190, 62)'
            }}
          />
        </div>

        {/* Post/ATM Machine */}
        <div className={`absolute w-16 h-20 bg-gray-400 rounded-lg overflow-hidden transition-all duration-1000 ${
          isHovered ? '-translate-y-20' : 'translate-y-12'
        }`}
          style={{
            animation: isHovered ? 'slide-post 1s cubic-bezier(0.165, 0.84, 0.44, 1) both' : 'none'
          }}
        >
          {/* Post line */}
          <div className="absolute w-12 h-2 bg-gray-700 top-2 right-2 rounded-b-sm">
            <div className="absolute w-12 h-2 bg-gray-600 -top-2 left-0" />
          </div>

          {/* Screen */}
          <div className="absolute w-12 h-6 bg-white top-6 right-2 rounded-sm flex items-center justify-center">
            <span className={`text-sm font-semibold text-green-700 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>$</span>
          </div>

          {/* Numbers */}
          <div
            className="absolute w-3 h-3 bg-gray-700 rounded-sm left-6 top-14 transform rotate-90"
            style={{
              boxShadow: '0 -4 0 0 rgb(131, 129, 131), 0 4 0 0 rgb(131, 129, 131)'
            }}
          />
          <div
            className="absolute w-3 h-3 bg-gray-500 rounded-sm left-6 top-20 transform rotate-90"
            style={{
              boxShadow: '0 -4 0 0 rgb(170, 169, 171), 0 4 0 0 rgb(170, 169, 171)'
            }}
          />
        </div>
      </div>

      {/* Right Side - Text & Arrow */}
      <div className="flex-1 flex items-center justify-between px-5 overflow-hidden hover:bg-gray-50 transition-colors duration-300">
        <span className="text-2xl font-semibold text-gray-900 whitespace-nowrap">
          New Transaction
        </span>
        <svg
          viewBox="0 0 451.846 451.847"
          className="w-5 h-5 mr-5 flex-shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"
            fill="#cfcfcf"
          />
        </svg>
      </div>

      <style>{`
        @keyframes slide-top {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-70px) rotate(90deg);
          }
          60% {
            transform: translateY(-70px) rotate(90deg);
          }
          100% {
            transform: translateY(-8px) rotate(90deg);
          }
        }

        @keyframes slide-post {
          50% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-70px);
          }
        }
      `}</style>
    </div>
  )
}
