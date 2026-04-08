'use client'

import React, { useState } from 'react'

export function WeatherCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative w-64 h-96 flex items-center justify-center">
      {/* Main Card - Front */}
      <div
        className={`absolute w-64 h-32 rounded-3xl bg-gray-100 text-black z-20 transition-all duration-400 cursor-pointer ${
          isHovered ? 'bg-yellow-200' : 'bg-gray-100'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Weather Icon */}
        <svg className="w-20 h-20 relative m-4" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="35" fill="#FFD700" opacity="0.8" />
          <circle cx="70" cy="30" r="25" fill="#FFA500" opacity="0.6" />
        </svg>

        {/* Temperature */}
        <div className="absolute top-6 left-24 text-2xl font-bold">23 °C</div>

        {/* Location */}
        <div className="absolute top-16 left-24 text-xs text-gray-600">
          Dunmore, Ireland
        </div>
      </div>

      {/* Details Card - Back */}
      <div
        className={`absolute w-60 rounded-3xl bg-white text-black z-10 transition-all duration-400 overflow-hidden ${
          isHovered ? 'h-96' : 'h-32'
        }`}
      >
        {/* Upper Section */}
        <div className="flex flex-row gap-16 relative pt-2 pl-8">
          {/* Humidity */}
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 mb-2" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M15 5 Q10 15 15 25 Q20 15 15 5" fill="currentColor" opacity="0.6" />
            </svg>
            <div className="text-center text-xs">
              <div className="font-semibold">Humidity</div>
              <div>30%</div>
            </div>
          </div>

          {/* Wind */}
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 mb-2" viewBox="0 0 30 30">
              <path d="M5 15 Q15 10 25 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 20 L25 15 L20 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div className="text-center text-xs">
              <div className="font-semibold">Wind</div>
              <div>8 Km/h</div>
            </div>
          </div>
        </div>

        {/* Lower Section */}
        <div
          className={`flex flex-row justify-around px-6 text-xs text-center transition-all duration-400 ${
            isHovered ? 'translate-y-80' : 'translate-y-0'
          }`}
        >
          {/* AQI */}
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
              <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="0.5" />
              <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="0.5" />
            </svg>
            <div>
              <div className="font-semibold">AQI</div>
              <div>30</div>
            </div>
          </div>

          {/* Real Feel */}
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 20 20">
              <path
                d="M10 3 L10 15 M7 12 Q7 17 10 17 Q13 17 13 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <div>
              <div className="font-semibold">Real Feel</div>
              <div>21 °C</div>
            </div>
          </div>

          {/* Pressure */}
          <div className="flex flex-col items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="10" cy="10" r="2" fill="currentColor" />
            </svg>
            <div>
              <div className="font-semibold">Pressure</div>
              <div>1012 mbar</div>
            </div>
          </div>
        </div>

        {/* Health Status */}
        <div className="absolute bottom-0 w-full h-8 bg-lime-500 rounded-b-3xl flex items-center justify-center text-xs font-semibold text-white">
          Healthy
        </div>
      </div>
    </div>
  )
}
