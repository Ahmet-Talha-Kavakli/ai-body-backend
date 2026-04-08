'use client'

import React, { useState } from 'react'

export function SendMessageButton() {
  const [isSent, setIsSent] = useState(false)

  const handleClick = () => {
    setIsSent(true)
    setTimeout(() => setIsSent(false), 3000)
  }

  return (
    <div className="flex items-center justify-center p-8">
      <button
        onClick={handleClick}
        className="group relative min-w-[200px] h-[68px] px-5 py-5 rounded-[14px] font-semibold text-lg text-shadow cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-100 flex items-center justify-center"
        style={{
          borderRadius: '14px',
          textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
          border: 'none',
          boxShadow: `
            0 0.5px 0.5px 1px rgba(255, 255, 255, 0.2),
            0 10px 20px rgba(0, 0, 0, 0.2),
            0 4px 5px 0px rgba(0, 0, 0, 0.05)
          `,
          background: 'linear-gradient(to top, #f7f8f7, #e7e7e7)',
        }}
      >
        {/* Outline glow */}
        <div
          className="absolute inset-0 rounded-[14px] overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-400 -inset-1"
          style={{
            zIndex: 1,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 180deg, transparent 60%, white 80%, transparent 100%)',
              animation: 'spin 2s linear infinite',
              inset: '-100%',
            }}
          />
        </div>

        {/* Glass shine effect */}
        <div
          className="absolute inset-0 rounded-[30px] z-[2]"
          style={{
            inset: '7px 6px 6px 6px',
            background: 'linear-gradient(to top, #f7f8f7, #e7e7e7)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* Border gradient */}
        <div
          className="absolute inset-0 rounded-[14px] border-[2.5px] border-transparent group-hover:scale-[1.05] group-hover:scale-y-[1.1] transition-transform duration-400"
          style={{
            background: `
              linear-gradient(#f7f8f7, #e7e7e7) padding-box,
              linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.45)) border-box
            `,
            zIndex: 0,
          }}
        />

        {/* Content */}
        <div className="relative z-[3] flex items-center justify-center">
          {/* Default state */}
          {!isSent && (
            <div className="flex items-center justify-center relative pl-[29px]">
              {/* Plane icon */}
              <div
                className="absolute left-0 top-0 bottom-0 m-auto transition-all duration-300 flex items-center justify-center"
                style={{
                  transform: 'scale(1.25)',
                }}
              >
                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ overflow: 'visible' }}
                >
                  <g style={{ filter: 'url(#shadow)' }}>
                    <path
                      d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <filter id="shadow">
                      <feDropShadow dx={0} dy={1} stdDeviation="0.6" floodOpacity="0.5" />
                    </filter>
                  </defs>
                </svg>
              </div>

              {/* Text letters */}
              <p className="flex items-center justify-center">
                {['S', 'e', 'n', 'd', 'M', 'e', 's', 's', 'a', 'g', 'e'].map((char, i) => (
                  <span
                    key={i}
                    className="block opacity-0 transition-all duration-300"
                    style={{
                      animation: `slideDown 0.8s ease forwards`,
                      animationDelay: `${i * 0.03}s`,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Sent state */}
          {isSent && (
            <div className="flex items-center justify-center relative pl-[29px]">
              {/* Check icon */}
              <div
                className="transition-all duration-300 flex items-center justify-center"
                style={{
                  transform: 'scale(1.25)',
                  marginRight: '8px',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  strokeWidth="0.5px"
                  stroke="black"
                >
                  <g style={{ filter: 'url(#shadow)' }}>
                    <path
                      fill="currentColor"
                      d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                    />
                    <path
                      fill="currentColor"
                      d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                    />
                  </g>
                </svg>
              </div>

              {/* Sent text */}
              <p className="flex items-center justify-center">
                {['S', 'e', 'n', 't'].map((char, i) => (
                  <span
                    key={i}
                    className="block opacity-0 transition-all duration-300"
                    style={{
                      animation: `slideDown 0.8s ease forwards`,
                      animationDelay: `${(i + 5) * 0.2}s`,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
      </button>

      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-20px) translateX(5px) rotate(-90deg);
            color: #ff5569;
            filter: blur(5px);
          }
          30% {
            opacity: 1;
            transform: translateY(4px) translateX(0) rotate(0);
            filter: blur(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px) translateX(0) rotate(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0);
          }
        }

        @keyframes wave {
          30% {
            opacity: 1;
            transform: translateY(4px) translateX(0) rotate(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px) translateX(0) rotate(0);
            color: #ff5569;
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0);
          }
        }

        @keyframes takeOff {
          0% {
            opacity: 1;
          }
          60% {
            opacity: 1;
            transform: translateX(70px) rotate(45deg) scale(2);
          }
          100% {
            opacity: 0;
            transform: translateX(160px) rotate(45deg) scale(0);
          }
        }

        @keyframes land {
          0% {
            transform: translateX(-60px) translateY(30px) rotate(-50deg) scale(2);
            opacity: 0;
            filter: blur(3px);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(0);
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes appear {
          0% {
            opacity: 0;
            transform: scale(4) rotate(-40deg);
            color: #ff5569;
            filter: blur(4px);
          }
          30% {
            opacity: 1;
            transform: scale(0.6);
            filter: blur(1px);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes contrail {
          0% {
            width: 0;
            opacity: 1;
          }
          8% {
            width: 15px;
          }
          60% {
            opacity: 0.7;
            width: 80px;
          }
          100% {
            opacity: 0;
            width: 160px;
          }
        }

        @keyframes disappear {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            transform: translateX(5px) translateY(20px);
            color: #ff5569;
            filter: blur(5px);
          }
        }
      `}</style>
    </div>
  )
}
