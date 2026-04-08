'use client'

import React from 'react'

export function FolderFlip() {
  return (
    <section className="relative group flex flex-col items-center justify-center w-full h-full">
      <div className="file relative w-60 h-40 cursor-pointer origin-bottom" style={{ perspective: '1500px' }}>
        {/* Back Cover */}
        <div className="work-5 bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-2xl transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:bg-amber-600" style={{ clipPath: 'polygon(0 35%, 0% 100%, 50% 100%)' }} />

        {/* Layer 4 */}
        <div
          className="work-4 absolute inset-1 bg-zinc-400 rounded-2xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]"
        />

        {/* Layer 3 */}
        <div
          className="work-3 absolute inset-1 bg-zinc-300 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]"
        />

        {/* Layer 2 */}
        <div
          className="work-2 absolute inset-1 bg-zinc-200 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]"
        />

        {/* Front Cover */}
        <div
          className="work-1 absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[156px] rounded-2xl rounded-tr-none transition-all ease duration-300 origin-bottom flex items-end group-hover:shadow-[inset_0_20px_40px_#fbbf24,_inset_0_-20px_40px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 85%)',
          }}
        >
          {/* Tab top right */}
          <div
            className="absolute right-0 w-[146px] h-4 bg-amber-400 rounded-t-2xl"
            style={{
              bottom: '99%',
              content: "''",
            }}
          />

          {/* Tab corner */}
          <div
            className="absolute size-3 bg-amber-400"
            style={{
              top: '-10px',
              right: '142px',
              clipPath: 'polygon(100% 14%, 50% 100%, 100% 100%)',
            }}
          />
        </div>
      </div>

      <p className="text-3xl pt-4 opacity-20">Hover over</p>
    </section>
  )
}
