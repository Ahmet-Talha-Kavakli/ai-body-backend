'use client'

import React from 'react'

export function FoldButton() {
  return (
    <div className="flex items-center justify-center p-8">
      <button
        className="relative px-[1.4em] py-[0.7em] text-lg font-bold bg-red-700 text-gray-300 border-none rounded-lg cursor-pointer transition-all duration-300 active:shadow-md active:translate-x-[0.1em] active:translate-y-[0.1em]"
        style={{
          boxShadow: '0.5em 0.5em 0.5em rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Fold corner effect */}
        <div
          className="absolute top-0 left-0 overflow-hidden rounded-bl-lg transition-all duration-300 group-hover:w-[1.6em] group-hover:h-[1.6em]"
          style={{
            width: '0',
            height: '0',
            background: 'linear-gradient(135deg, rgba(33,33,33,1) 0%, rgba(33,33,33,1) 50%, rgba(150,4,31,1) 50%, rgba(191,4,38,1) 60%)',
            boxShadow: '0.2em 0.2em 0.2em rgba(0, 0, 0, 0.3)',
          }}
        />

        {/* Button text */}
        <b>Fold me!</b>
      </button>

      <style>{`
        button:hover::before {
          width: 1.6em;
          height: 1.6em;
        }

        button::before {
          position: absolute;
          content: '';
          height: 0;
          width: 0;
          top: 0;
          left: 0;
          background: linear-gradient(135deg, rgba(33,33,33,1) 0%, rgba(33,33,33,1) 50%, rgba(150,4,31,1) 50%, rgba(191,4,38,1) 60%);
          border-radius: 0 0 0.5em 0;
          box-shadow: 0.2em 0.2em 0.2em rgba(0, 0, 0, 0.3);
          transition: 0.3s;
        }

        button:hover::before {
          width: 1.6em;
          height: 1.6em;
        }
      `}</style>
    </div>
  )
}
