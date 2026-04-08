'use client'

import React from 'react'

export function GoBackButton() {
  return (
    <button
      className="group relative w-48 h-14 rounded-2xl bg-white text-center text-xl font-semibold text-black"
      type="button"
    >
      {/* Animated Background */}
      <div className="absolute left-1 top-1 z-10 flex h-12 w-1/4 items-center justify-center rounded-xl bg-green-400 transition-all duration-500 group-hover:w-[184px]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="25px" width="25px">
          <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#000000" />
          <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="#000000" />
        </svg>
      </div>

      {/* Text */}
      <p className="translate-x-2">Go Back</p>
    </button>
  )
}
