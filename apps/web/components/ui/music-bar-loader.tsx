'use client'

import React from 'react'

export function MusicBarLoader() {
  return (
    <div className="relative w-20 h-24">
      {/* Bar 1 */}
      <div
        className="absolute bottom-0 left-0 w-2.5 h-1/2 bg-black shadow-sm origin-bottom"
        style={{
          animation: 'barUp1 4s infinite',
          boxShadow: '1px 1px 0 rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Bar 2 */}
      <div
        className="absolute bottom-0 left-4 w-2.5 h-1/2 bg-black shadow-sm origin-bottom"
        style={{
          animation: 'barUp2 4s infinite',
          transform: 'scaleY(0.4)',
          boxShadow: '1px 1px 0 rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Bar 3 */}
      <div
        className="absolute bottom-0 left-8 w-2.5 h-1/2 bg-black shadow-sm origin-bottom"
        style={{
          animation: 'barUp3 4s infinite',
          transform: 'scaleY(0.6)',
          boxShadow: '1px 1px 0 rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Bar 4 */}
      <div
        className="absolute bottom-0 left-12 w-2.5 h-1/2 bg-black shadow-sm origin-bottom"
        style={{
          animation: 'barUp4 4s infinite',
          transform: 'scaleY(0.8)',
          boxShadow: '1px 1px 0 rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Bar 5 */}
      <div
        className="absolute bottom-0 left-60 w-2.5 h-1/2 bg-black shadow-sm origin-bottom"
        style={{
          animation: 'barUp5 4s infinite',
          boxShadow: '1px 1px 0 rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Ball */}
      <div
        className="absolute bottom-2.5 left-0 w-2.5 h-2.5 bg-blue-500 rounded-full"
        style={{
          animation: 'ball624 4s infinite',
        }}
      />

      <style>{`
        @keyframes barUp1 {
          0% { transform: scaleY(0.2); }
          40% { transform: scaleY(0.2); }
          50% { transform: scaleY(1); }
          90% { transform: scaleY(1); }
          100% { transform: scaleY(0.2); }
        }

        @keyframes barUp2 {
          0% { transform: scaleY(0.4); }
          40% { transform: scaleY(0.4); }
          50% { transform: scaleY(0.8); }
          90% { transform: scaleY(0.8); }
          100% { transform: scaleY(0.4); }
        }

        @keyframes barUp3 {
          0% { transform: scaleY(0.6); }
          100% { transform: scaleY(0.6); }
        }

        @keyframes barUp4 {
          0% { transform: scaleY(0.8); }
          40% { transform: scaleY(0.8); }
          50% { transform: scaleY(0.4); }
          90% { transform: scaleY(0.4); }
          100% { transform: scaleY(0.8); }
        }

        @keyframes barUp5 {
          0% { transform: scaleY(1); }
          40% { transform: scaleY(1); }
          50% { transform: scaleY(0.2); }
          90% { transform: scaleY(0.2); }
          100% { transform: scaleY(1); }
        }

        @keyframes ball624 {
          0% { transform: translate(0, 0); }
          5% { transform: translate(8px, -14px); }
          10% { transform: translate(15px, -10px); }
          17% { transform: translate(23px, -24px); }
          20% { transform: translate(30px, -20px); }
          27% { transform: translate(38px, -34px); }
          30% { transform: translate(45px, -30px); }
          37% { transform: translate(53px, -44px); }
          40% { transform: translate(60px, -40px); }
          50% { transform: translate(60px, 0); }
          57% { transform: translate(53px, -14px); }
          60% { transform: translate(45px, -10px); }
          67% { transform: translate(37px, -24px); }
          70% { transform: translate(30px, -20px); }
          77% { transform: translate(22px, -34px); }
          80% { transform: translate(15px, -30px); }
          87% { transform: translate(7px, -44px); }
          90% { transform: translate(0, -40px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  )
}
