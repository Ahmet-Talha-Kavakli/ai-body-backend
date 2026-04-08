'use client'

import React from 'react'

export function MorphingLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="relative w-[100px] h-[100px] rounded-full"
        style={{
          '--color-one': '#ffbf48',
          '--color-two': '#be4a1d',
          '--color-three': '#ffbf4780',
          '--color-four': '#bf4a1d80',
          '--color-five': '#ffbf4740',
          '--time-animation': '2s',
          boxShadow: `
            0 0 25px 0 var(--color-three),
            0 20px 50px 0 var(--color-four)
          `,
          animation: 'colorize calc(var(--time-animation) * 3) ease-in-out infinite',
          filter: 'hue-rotate(0deg)',
        } as React.CSSProperties}
      >
        {/* Gradient background circle */}
        <div
          className="absolute inset-0 rounded-full border-t-2 border-b-2"
          style={{
            borderTopColor: 'var(--color-one)',
            borderBottomColor: 'var(--color-two)',
            background: 'linear-gradient(180deg, var(--color-five), var(--color-four))',
            boxShadow: `
              inset 0 10px 10px 0 var(--color-three),
              inset 0 -10px 10px 0 var(--color-four)
            `,
          }}
        />

        {/* SVG with clipping mask */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          width={100}
          height={100}
        >
          <defs>
            <mask id="clipping" style={{ filter: 'contrast(15)' }}>
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />

              {/* Triangle 1 */}
              <polygon
                points="25,25 75,25 50,75"
                fill="white"
                style={{
                  filter: 'blur(7px)',
                  transformOrigin: '75% 25%',
                  transform: 'rotate(90deg)',
                }}
              />

              {/* Triangle 2 */}
              <polygon
                points="50,25 75,75 25,75"
                fill="white"
                style={{
                  filter: 'blur(7px)',
                  transformOrigin: '50% 50%',
                  animation: 'rotation 2s linear infinite reverse',
                }}
              />

              {/* Triangle 3 */}
              <polygon
                points="35,35 65,35 50,65"
                fill="white"
                style={{
                  filter: 'blur(7px)',
                  transformOrigin: '50% 60%',
                  animation: 'rotation 2s linear infinite',
                  animationDelay: 'calc(2s / -3)',
                }}
              />

              {/* Triangle 4 */}
              <polygon
                points="35,35 65,35 50,65"
                fill="white"
                style={{
                  filter: 'blur(7px)',
                  transformOrigin: '40% 40%',
                  animation: 'rotation 2s linear infinite reverse',
                }}
              />

              {/* Triangle 5 */}
              <polygon
                points="35,35 65,35 50,65"
                fill="white"
                style={{
                  filter: 'blur(7px)',
                  transformOrigin: '40% 40%',
                  animation: 'rotation 2s linear infinite reverse',
                  animationDelay: 'calc(2s / -2)',
                }}
              />

              {/* Triangle 6 */}
              <polygon
                points="35,35 65,35 50,65"
                fill="white"
                style={{
                  filter: 'blur(7px)',
                  transformOrigin: '60% 40%',
                  animation: 'rotation 2s linear infinite',
                }}
              />

              {/* Triangle 7 */}
              <polygon
                points="35,35 65,35 50,65"
                fill="white"
                style={{
                  filter: 'blur(7px)',
                  transformOrigin: '60% 40%',
                  animation: 'rotation 2s linear infinite',
                  animationDelay: 'calc(2s / -1.5)',
                }}
              />
            </mask>
          </defs>

          {/* Masked gradient box */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            style={{
              background: 'linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%)',
              mask: 'url(#clipping)',
              WebkitMask: 'url(#clipping)',
            }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes roundness {
          0% {
            filter: contrast(15);
          }
          20% {
            filter: contrast(3);
          }
          40% {
            filter: contrast(3);
          }
          60% {
            filter: contrast(15);
          }
          100% {
            filter: contrast(15);
          }
        }

        @keyframes colorize {
          0% {
            filter: hue-rotate(0deg);
          }
          20% {
            filter: hue-rotate(-30deg);
          }
          40% {
            filter: hue-rotate(-60deg);
          }
          60% {
            filter: hue-rotate(-90deg);
          }
          80% {
            filter: hue-rotate(-45deg);
          }
          100% {
            filter: hue-rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}
