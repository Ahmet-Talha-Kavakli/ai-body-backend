'use client'

import React, { useState } from 'react'

interface FileItem {
  id: number
  name: string
  tag: string
  icon: React.ReactNode
  color: string
}

export function InteractiveFolderCard() {
  const [isOpen, setIsOpen] = useState(false)

  const files: FileItem[] = [
    {
      id: 5,
      name: 'Hero_BG.png',
      tag: 'PNG • 4.2 MB',
      color: 'bg-purple-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      id: 4,
      name: 'Promo_Cut.mp4',
      tag: 'MP4 • 128 MB',
      color: 'bg-cyan-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
        </svg>
      ),
    },
    {
      id: 3,
      name: 'app_config.json',
      tag: 'JSON • 12 KB',
      color: 'bg-blue-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      id: 2,
      name: 'Q3_Report.pdf',
      tag: 'PDF • 1.1 MB',
      color: 'bg-yellow-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1={16} y1={13} x2={8} y2={13} />
          <line x1={16} y1={17} x2={8} y2={17} />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: 1,
      name: 'Pitch_Deck.pptx',
      tag: 'PPTX • 8.4 MB',
      color: 'bg-red-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
          <line x1={8} y1={21} x2={16} y2={21} />
          <line x1={12} y1={17} x2={12} y2={21} />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex items-center justify-center p-8">
      <label className="relative w-[170px] h-[130px] cursor-pointer perspective" style={{ perspective: '1200px' }}>
        {/* Hidden checkbox */}
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(e) => setIsOpen(e.target.checked)}
          className="hidden"
        />

        {/* Hint wrapper */}
        <div
          className="absolute -top-10 -right-12 flex flex-col items-center gap-0.5 pointer-events-none z-[100]"
          style={{
            animation: isOpen ? 'none' : 'floatHint 2.5s ease-in-out infinite',
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          <span
            className="text-blue-400 text-xs font-black underline whitespace-nowrap"
            style={{
              letterSpacing: '0.5px',
              transform: 'rotate(45deg)',
              position: 'relative',
              right: '-25px',
              top: '10px',
            }}
          >
            Click to open
          </span>
          <svg className="h-[35px] w-[35px] text-blue-400" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 35 5 C 35 5, 15 5, 10 25 M 10 25 L 3 18 M 10 25 L 18 22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Folder container */}
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
            transform: isOpen ? 'rotateX(10deg) rotateY(-5deg)' : 'rotateX(0) rotateY(0)',
          }}
        >
          {/* Folder back */}
          <svg
            className="absolute bottom-0 w-full"
            style={{
              filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))',
            }}
            viewBox="0 0 50 40"
            fill="none"
          >
            <path
              d="M0 4C0 1.79086 1.79086 0 4 0H16.524C17.721 0 18.8415 0.54051 19.574 1.4673L22.426 5.0654C23.1585 5.99219 24.279 6.5327 25.476 6.5327H46C48.2091 6.5327 50 8.32356 50 10.5327V36C50 38.2091 48.2091 40 46 40H4C1.79086 40 0 38.2091 0 36V4Z"
              fill="#0056b3"
            />
          </svg>

          {/* Search bar */}
          <div
            className="absolute top-[-40px] left-[10%] flex items-center gap-2 px-2 py-1.5 bg-blue-400 backdrop-blur-md rounded-full z-[100] border border-white border-opacity-20 transition-all duration-500"
            style={{
              width: isOpen ? '80%' : '30px',
              height: '25px',
              opacity: isOpen ? 1 : 0,
            }}
          >
            <svg className="w-3 h-3 text-white flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <circle cx={11} cy={11} r={8} />
              <line x1={21} y1={21} x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search files..."
              className="flex-1 bg-transparent border-none text-white text-xs outline-none placeholder-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Files */}
          {files.map((file, idx) => (
            <div
              key={file.id}
              className={`absolute bottom-1.5 left-[10%] w-4/5 h-[85px] rounded-md overflow-hidden transition-all duration-600 cursor-pointer hover:brightness-110 ${file.color}`}
              style={{
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 25 - idx,
                transitionDelay: `${isOpen ? (0.15 - idx * 0.05) : 0}s`,
                transform: isOpen ? `translateY(-${(5 - file.id) * 15}px) rotate(${[0, -5, 12, -15, 8][(5 - file.id)]}deg) translateX(${[0, 12, -8, 18, -15][(5 - file.id)]}px)` : 'translateY(0)',
              }}
            >
              {/* Shine effect */}
              <div
                className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent"
                style={{
                  transform: 'skewX(-20deg)',
                  left: isOpen ? '150%' : '-100%',
                  transition: isOpen ? 'left 0.8s ease-in-out 0.3s' : 'none',
                }}
              />

              {/* File icon */}
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-white opacity-40 hover:opacity-90 transition-opacity">
                {file.icon}
              </div>

              {/* File text */}
              <div
                className="px-3 py-3 text-white font-black text-xs text-shadow transition-all duration-300"
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateY(0)' : 'translateY(5px)',
                  transitionDelay: isOpen ? '0.4s' : '0s',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
              >
                {file.name}
              </div>

              {/* File tag */}
              <div
                className="absolute bottom-2.5 right-2.5 bg-black bg-opacity-50 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded text-opacity-90 transition-all duration-300"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(10px)',
                  fontSize: '7px',
                }}
              >
                {file.tag}
              </div>
            </div>
          ))}

          {/* Folder front */}
          <div
            className="absolute bottom-[-7px] w-full z-[90] rounded-xl transition-transform duration-500"
            style={{
              transformOrigin: 'bottom',
              transform: isOpen ? 'rotateX(-50deg)' : 'rotateX(0deg)',
            }}
          >
            <svg className="w-full" viewBox="0 0 50 34" fill="none">
              <path d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z" fill="rgba(0, 123, 255, 0.65)" />
            </svg>

            {/* Folder label */}
            <div className="absolute top-2.5 left-2.5 w-7.5 h-1 bg-white bg-opacity-50 rounded-full" />

            {/* Counter */}
            <div
              className="absolute top-[-95px] right-[-75px] bg-purple-400 px-2 py-1 rounded-full flex items-center gap-2 transition-all duration-500"
              style={{
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0) translateY(20px)',
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? '0.2s' : '0s',
                pointerEvents: isOpen ? 'auto' : 'none',
              }}
            >
              {/* Status dot */}
              <div className="relative w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 10px #34d399' }}>
                <div
                  className="absolute inset-0 bg-emerald-400 rounded-full"
                  style={{
                    animation: 'pulse 2s infinite',
                  }}
                />
              </div>

              <span className="text-black font-black text-xs uppercase">Files</span>
              <span className="text-white font-black text-sm" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                05
              </span>
            </div>
          </div>
        </div>
      </label>

      <style>{`
        @keyframes floatHint {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
