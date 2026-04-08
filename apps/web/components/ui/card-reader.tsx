'use client'

import React from 'react'

export function CardReader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="relative w-[270px] h-[220px] bg-gray-100 rounded-[70px]"
        style={{
          boxShadow: `
            inset 0px 35px 25px rgba(255, 255, 255, 0.88),
            inset 10px 0px 25px rgba(0, 0, 0, 0.29),
            inset 40px 0px 20px #ffffff,
            inset -10px 0px 25px rgba(0, 0, 0, 0.29),
            inset -40px 0px 20px #fff,
            inset 0px 10px 10px rgba(0, 0, 0, 0.88),
            inset 0px -15px 25px rgba(0, 0, 0, 0.21),
            10px 25px 40px -10px rgba(0, 0, 0, 0.375)
          `,
        }}
      >
        {/* Cavity/Slot */}
        <div
          className="absolute w-[150px] h-[20px] left-1/2 rounded-[200px]"
          style={{
            background: 'linear-gradient(180deg, #d6d6d6, #fff)',
            top: '30%',
            transform: 'translate(-50%, 30%)',
          }}
        />

        {/* Line */}
        <div
          className="relative w-full h-0.5 bg-gray-400"
          style={{ marginTop: '30%' }}
        >
          {/* Line accent left */}
          <div
            className="absolute w-[5%] h-0.5 bg-white"
            style={{ left: 0 }}
          />
          {/* Line accent right */}
          <div
            className="absolute w-[5%] h-0.5 bg-white"
            style={{ right: 0 }}
          />
        </div>

        {/* LED Indicator */}
        <div
          className="absolute w-[7px] h-[7px] rounded-full bg-green-400"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, 30%)',
            boxShadow: '0 0 6px #3eff4b',
          }}
        />

        {/* Text */}
        <div
          className="text-center font-bold text-gray-400"
          style={{ marginTop: '70px' }}
        >
          UIVERSE
        </div>
      </div>
    </div>
  )
}
