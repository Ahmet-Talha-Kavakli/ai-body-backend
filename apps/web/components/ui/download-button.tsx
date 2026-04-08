'use client'

import React from 'react'

export function DownloadButton() {
  return (
    <button className="relative border-0 text-white text-sm font-semibold cursor-pointer rounded-md z-10 overflow-hidden group">
      {/* Docs Section */}
      <div className="relative flex items-center justify-between gap-2 min-h-10 px-2.5 rounded-md z-10 bg-gray-900 border border-white/20 transition-all duration-500 ease-out group-hover:opacity-100">
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          stroke="currentColor"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1={16} y1={13} x2={8} y2={13} />
          <line x1={16} y1={17} x2={8} y2={17} />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>Docs</span>
      </div>

      {/* Download Section */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-md z-0 bg-green-500 border border-green-500/20 transition-all duration-500 ease-out group-hover:translate-y-full"
        style={{
          maxWidth: '90%',
          margin: '0 auto',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={24}
          height={24}
          stroke="currentColor"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:animate-bounce"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1={12} y1={15} x2={12} y2={3} />
        </svg>
      </div>

      {/* Hover Shadow */}
      <style>{`
        button:hover {
          box-shadow:
            rgba(0, 0, 0, 0.25) 0px 54px 55px,
            rgba(0, 0, 0, 0.12) 0px -12px 30px,
            rgba(0, 0, 0, 0.12) 0px 4px 6px,
            rgba(0, 0, 0, 0.17) 0px 12px 13px,
            rgba(0, 0, 0, 0.09) 0px -3px 5px;
        }

        svg polyline,
        svg line {
          animation: download-animation 1s infinite;
        }

        @keyframes download-animation {
          0% {
            transform: translateY(0%);
          }
          50% {
            transform: translateY(-15%);
          }
          100% {
            transform: translateY(0%);
          }
        }
      `}</style>
    </button>
  )
}
