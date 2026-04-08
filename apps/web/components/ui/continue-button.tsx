'use client'

import React from 'react'

export function ContinueButton() {
  return (
    <button className="group relative px-7 py-[17px] pl-[69px] border-none outline-none cursor-pointer rounded-md text-sm font-medium leading-[19px] bg-gray-700 text-white transition-all duration-300 hover:bg-gray-600">
      {/* Left Panel with Folder and Pencil */}
      <div className="absolute top-0 left-0 bottom-0 w-[53px] overflow-hidden rounded-l-md bg-gray-900">
        {/* Folder */}
        <div className="absolute left-[15px] top-[13px] w-[23px] h-[27px]">
          {/* Folder Top */}
          <div className="absolute left-0 top-0 z-20 transition-transform duration-400 group-hover:translate-x-[-40px]">
            <svg
              viewBox="0 0 24 27"
              className="w-6 h-[27px] fill-amber-100 transform-gpu transition-transform duration-300 group-hover:duration-0 group-hover:[transform:perspective(120px)_rotateY(-60deg)]"
              style={{
                transformOrigin: '0 50%',
              }}
            >
              <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z" />
            </svg>
          </div>

          {/* Folder Back */}
          <div
            className="absolute left-0 top-0 w-[23px] h-[27px] rounded-sm bg-yellow-700 shadow-lg transition-transform duration-400 group-hover:translate-x-[-40px] group-hover:delay-[150ms]"
            style={{
              boxShadow: '0 1.5px 3px rgba(13, 15, 25, 0.2), 0 2.5px 5px rgba(13, 15, 25, 0.2), 0 3.5px 7px rgba(13, 15, 25, 0.2)',
            }}
          />

          {/* Folder Behind Paper */}
          <div className="absolute left-[1px] top-[1px] w-[21px] h-[25px] rounded-sm bg-blue-50 transition-all duration-400 group-hover:translate-x-[3px] group-hover:translate-y-[-3px] group-hover:delay-[150ms]" />

          {/* Paper */}
          <div className="absolute left-[1px] top-[1px] z-10 w-[21px] h-[25px] rounded-sm bg-white">
            {/* Lines */}
            <div className="absolute left-[3px] top-[3px] w-[14px] h-[2px] rounded-sm bg-blue-300 scale-y-50">
              <div
                className="absolute left-0 top-3 w-[14px] h-[2px] rounded-sm bg-blue-300 scale-y-50"
                style={{
                  boxShadow: '0 12px 0 0 rgb(187, 193, 225), 0 24px 0 0 rgb(187, 193, 225)',
                }}
              />
            </div>
            <div className="absolute left-[3px] top-[6px] w-[10px] h-[2px] rounded-sm bg-blue-300 scale-y-50" />
          </div>
        </div>

        {/* Pencil */}
        <div
          className="absolute w-[3px] h-[2px] rounded-t-sm top-[8px] left-[105%] z-30 bg-white transition-transform duration-400 group-hover:translate-x-[-24px] group-hover:delay-[150ms]"
          style={{
            transformOrigin: '50% 19px',
            transform: 'rotate(35deg)',
          }}
        >
          {/* Pencil Body */}
          <div
            className="absolute left-[-1px] top-[2px] w-[5px] h-[20px] rounded-t-[2px]"
            style={{
              background: 'linear-gradient(#275EFE 55%, #fff 55.1%, #fff 60%, #5C86FF 60.1%)',
              clipPath: 'polygon(0 5%, 5px 5%, 5px 17px, 50% 20px, 0 17px)',
            }}
          />

          {/* Pencil Tip */}
          <div
            className="absolute left-[3px] top-[3px] w-[3px] h-[6px] rounded-tr border-t border-r border-t-blue-500 border-r-blue-500"
          />
        </div>
      </div>

      {/* Text */}
      <span className="relative">Continue Application</span>

      {/* Checkmark Animation */}
      <div
        className="absolute top-[26px] right-4 w-2.5 h-[2px] rounded-sm bg-white transition-transform duration-300 origin-[9px_1px] group-hover:translate-x-[2px] group-hover:scale-50 group-hover:rotate-[-45deg]"
      />
      <div
        className="absolute top-[26px] right-4 w-2.5 h-[2px] rounded-sm bg-white transition-transform duration-300 origin-[9px_1px] group-hover:translate-x-[2px] group-hover:scale-50 group-hover:rotate-[45deg]"
      />

      <style>{`
        button:hover {
          --cx: 2px;
        }
      `}</style>
    </button>
  )
}
