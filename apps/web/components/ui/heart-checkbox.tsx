'use client'

import React, { useState } from 'react'

export function HeartCheckbox() {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <div className="relative w-12 h-12 transition-all duration-300">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => setIsChecked(e.target.checked)}
        className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
        title="Like"
      />

      <div className="absolute w-full h-full flex items-center justify-center">
        {/* Outline Heart */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute w-8 h-8 transition-all duration-300 ${
            isChecked ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
          }`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Zm-3.585,18.4a2.973,2.973,0,0,1-3.83,0C4.947,16.006,2,11.87,2,8.967a4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,11,8.967a1,1,0,0,0,2,0,4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,22,8.967C22,11.87,19.053,16.006,13.915,20.313Z"
            fill="rgb(255, 91, 137)"
          />
        </svg>

        {/* Filled Heart */}
        <svg
          viewBox="0 0 24 24"
          className={`absolute w-8 h-8 transition-all duration-300 ${
            isChecked
              ? 'opacity-100 scale-100 brightness-150'
              : 'opacity-0 scale-0'
          }`}
          style={{
            animation: isChecked ? 'pulse-fill 1s ease-out' : 'none',
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z"
            fill="rgb(255, 91, 137)"
          />
        </svg>

        {/* Celebrate SVG */}
        <svg
          width={100}
          height={100}
          className={`absolute transition-all duration-500 pointer-events-none ${
            isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
          style={{
            animation: isChecked ? 'celebrate 0.5s ease-out forwards' : 'none',
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="10,10 20,20" stroke="rgb(255, 91, 137)" fill="rgb(255, 91, 137)" strokeWidth="2" />
          <polygon points="10,50 20,50" stroke="rgb(255, 91, 137)" fill="rgb(255, 91, 137)" strokeWidth="2" />
          <polygon points="20,80 30,70" stroke="rgb(255, 91, 137)" fill="rgb(255, 91, 137)" strokeWidth="2" />
          <polygon points="90,10 80,20" stroke="rgb(255, 91, 137)" fill="rgb(255, 91, 137)" strokeWidth="2" />
          <polygon points="90,50 80,50" stroke="rgb(255, 91, 137)" fill="rgb(255, 91, 137)" strokeWidth="2" />
          <polygon points="80,80 70,70" stroke="rgb(255, 91, 137)" fill="rgb(255, 91, 137)" strokeWidth="2" />
        </svg>
      </div>

      <style>{`
        @keyframes pulse-fill {
          0% {
            transform: scale(0);
          }
          25% {
            transform: scale(1.2);
          }
          50% {
            transform: scale(1);
            filter: brightness(1.5);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes celebrate {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
            filter: brightness(1.5);
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
