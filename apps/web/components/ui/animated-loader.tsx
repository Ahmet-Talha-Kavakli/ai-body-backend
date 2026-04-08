'use client'

import React from 'react'

export function AnimatedLoader() {
  return (
    <div className="relative w-96 h-96 flex items-center justify-center">
      {/* Loader 1 */}
      <div
        className="absolute w-40 h-24 bg-slate-800 rounded-sm"
        style={{
          top: '50%',
          left: '50%',
          marginLeft: '-80px',
          marginTop: '-50px',
          zIndex: 10,
          animation: 'dot1 3s cubic-bezier(0.55, 0.3, 0.24, 0.99) infinite',
        }}
      />

      {/* Loader 2 */}
      <div
        className="absolute bg-blue-700 rounded-sm"
        style={{
          width: '150px',
          height: '90px',
          top: '50%',
          left: '50%',
          marginLeft: '-75px',
          marginTop: '-45px',
          zIndex: 11,
          animation: 'dot2 3s cubic-bezier(0.55, 0.3, 0.24, 0.99) infinite',
        }}
      />

      {/* Loader 3 */}
      <div
        className="absolute bg-cyan-400 rounded-b-md"
        style={{
          width: '40px',
          height: '20px',
          top: '50%',
          left: '50%',
          marginLeft: '-20px',
          marginTop: '50px',
          zIndex: 12,
          animation: 'dot3 3s cubic-bezier(0.55, 0.3, 0.24, 0.99) infinite',
        }}
      />

      <style>{`
        @keyframes dot1 {
          3%, 97% {
            width: 160px;
            height: 100px;
            margin-top: -50px;
            margin-left: -80px;
          }
          30%, 36% {
            width: 80px;
            height: 120px;
            margin-top: -60px;
            margin-left: -40px;
          }
          63%, 69% {
            width: 40px;
            height: 80px;
            margin-top: -40px;
            margin-left: -20px;
          }
        }

        @keyframes dot2 {
          3%, 97% {
            height: 90px;
            width: 150px;
            margin-left: -75px;
            margin-top: -45px;
          }
          30%, 36% {
            width: 70px;
            height: 96px;
            margin-left: -35px;
            margin-top: -48px;
          }
          63%, 69% {
            width: 32px;
            height: 60px;
            margin-left: -16px;
            margin-top: -30px;
          }
        }

        @keyframes dot3 {
          3%, 97% {
            height: 20px;
            width: 40px;
            margin-left: -20px;
            margin-top: 50px;
            border-radius: 0 0 8px 8px;
          }
          30%, 36% {
            width: 8px;
            height: 8px;
            margin-left: -5px;
            margin-top: 49px;
            border-radius: 8px;
          }
          63%, 69% {
            width: 16px;
            height: 4px;
            margin-left: -8px;
            margin-top: -37px;
            border-radius: 10px;
          }
        }
      `}</style>
    </div>
  )
}
