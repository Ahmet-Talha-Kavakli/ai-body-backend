'use client'

import React from 'react'

export function ShakeSpinLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="relative w-[120px] h-[150px] bg-white rounded-lg"
        style={{
          backgroundRepeat: 'no-repeat',
          backgroundImage: `
            linear-gradient(#ddd 50%, #bbb 51%),
            linear-gradient(#ddd, #ddd),
            linear-gradient(#ddd, #ddd),
            radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, transparent 55%),
            radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, transparent 55%),
            radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, transparent 55%)
          `,
          backgroundPosition: '0 20px, 45px 0, 8px 6px, 55px 3px, 75px 3px, 95px 3px',
          backgroundSize: '100% 4px, 1px 23px, 30px 8px, 15px 15px, 15px 15px, 15px 15px',
          animation: 'shake 3s ease-in-out infinite',
          transformOrigin: '60px 180px',
        }}
      >
        {/* Shake base bottom supports */}
        <div
          className="absolute top-full left-[5px] w-[7px] h-[5px] bg-gray-400"
          style={{ borderRadius: '0 0 4px 4px', boxShadow: '102px 0 #aaa' }}
        />

        {/* Spinning record/wheel */}
        <div
          className="absolute bottom-[20px] left-0 right-0 mx-auto w-[95px] h-[95px] rounded-full border-[10px] border-gray-300"
          style={{
            backgroundColor: '#bbdefb',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.024) 0%, rgba(0, 0, 0, 0.024) 49%, transparent 50%, transparent 100%),
              linear-gradient(135deg, #64b5f6 50%, #607d8b 51%)
            `,
            backgroundSize: '30px 100%, 90px 80px',
            backgroundRepeat: 'repeat, no-repeat',
            backgroundPosition: '0 0',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 0 4px #999, inset 0 0 6px 6px rgba(0, 0, 0, 0.024)',
            animation: 'spin 3s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes shake {
          0%, 50%, 100% {
            transform: rotate(0);
          }
          50%, 75%, 84%, 92% {
            transform: rotate(-0.5deg);
          }
          65%, 80%, 88%, 96% {
            transform: rotate(0.5deg);
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(360deg);
          }
          75% {
            transform: rotate(750deg);
          }
          100% {
            transform: rotate(1800deg);
          }
        }
      `}</style>
    </div>
  )
}
