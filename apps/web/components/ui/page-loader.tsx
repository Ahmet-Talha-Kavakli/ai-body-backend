'use client'

import React from 'react'

export function PageLoader() {
  const PageIcon = () => (
    <svg fill="currentColor" viewBox="0 0 90 120" className="w-24 h-32 block">
      <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
    </svg>
  )

  return (
    <div className="relative w-56 h-40">
      {/* Loader Container */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-cyan-400 to-blue-600 z-10" style={{ perspective: '600px' }}>
        {/* Shadow Effects */}
        <div
          className="absolute bottom-2 left-1 w-32 h-4 transform -rotate-6"
          style={{
            boxShadow: '0 16px 12px rgba(39, 94, 254, 0.28)',
          }}
        />
        <div
          className="absolute bottom-2 right-1 w-32 h-4 transform rotate-6"
          style={{
            boxShadow: '0 16px 12px rgba(39, 94, 254, 0.28)',
          }}
        />

        {/* Pages List */}
        <ul className="list-none p-0 m-0 relative w-full h-full">
          {/* Page 1 - Static */}
          <li
            className="absolute top-2.5 left-2.5 text-white opacity-100 transform"
            style={{
              transformOrigin: '100% 50%',
              transform: 'rotateY(0deg)',
            }}
          >
            <PageIcon />
          </li>

          {/* Page 2 */}
          <li
            className="absolute top-2.5 left-2.5 text-white opacity-0"
            style={{
              transformOrigin: '100% 50%',
              transform: 'rotateY(180deg)',
              animation: 'page-2 3s ease infinite',
            }}
          >
            <PageIcon />
          </li>

          {/* Page 3 */}
          <li
            className="absolute top-2.5 left-2.5 text-white opacity-0"
            style={{
              transformOrigin: '100% 50%',
              transform: 'rotateY(180deg)',
              animation: 'page-3 3s ease infinite',
            }}
          >
            <PageIcon />
          </li>

          {/* Page 4 */}
          <li
            className="absolute top-2.5 left-2.5 text-white opacity-0"
            style={{
              transformOrigin: '100% 50%',
              transform: 'rotateY(180deg)',
              animation: 'page-4 3s ease infinite',
            }}
          >
            <PageIcon />
          </li>

          {/* Page 5 */}
          <li
            className="absolute top-2.5 left-2.5 text-white opacity-0"
            style={{
              transformOrigin: '100% 50%',
              transform: 'rotateY(180deg)',
              animation: 'page-5 3s ease infinite',
            }}
          >
            <PageIcon />
          </li>

          {/* Page 6 - Static Last */}
          <li
            className="absolute top-2.5 left-2.5 text-white opacity-100"
            style={{
              transformOrigin: '100% 50%',
              transform: 'rotateY(180deg)',
            }}
          >
            <PageIcon />
          </li>
        </ul>
      </div>

      {/* Loading Text */}
      <span className="block text-center mt-5 text-gray-500 text-sm">Loading</span>

      <style>{`
        @keyframes page-2 {
          0% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          35%, 100% {
            opacity: 0;
          }
          50%, 100% {
            transform: rotateY(0deg);
          }
        }

        @keyframes page-3 {
          15% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
          65%, 100% {
            transform: rotateY(0deg);
          }
        }

        @keyframes page-4 {
          30% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          65%, 100% {
            opacity: 0;
          }
          80%, 100% {
            transform: rotateY(0deg);
          }
        }

        @keyframes page-5 {
          45% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          65% {
            opacity: 1;
          }
          80%, 100% {
            opacity: 0;
          }
          95%, 100% {
            transform: rotateY(0deg);
          }
        }
      `}</style>
    </div>
  )
}
