'use client'

import React from 'react'

export function SmartWatchDisplay() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="relative"
        style={{
          transform: 'scale(0.7)',
        }}
      >
        {/* Watch container */}
        <div className="relative">
          {/* Top bezel */}
          <div
            className="absolute w-40 h-[200px] left-1/2"
            style={{
              background: 'radial-gradient(circle at 200px, rgb(0, 0, 0), rgb(48, 48, 48))',
              boxShadow: 'inset 0px 10px 18px #ffffffb9, 10px 0px 30px #00000071',
              transform: 'translate(-50%, -100%)',
            }}
          />

          {/* Bottom bezel */}
          <div
            className="absolute w-40 h-[200px] left-1/2"
            style={{
              background: 'radial-gradient(circle at 200px, rgb(0, 0, 0), rgb(48, 48, 48))',
              boxShadow: 'inset 0px -10px 18px #ffffffb9, 10px 0px 30px #00000071',
              transform: 'translate(-50%, 0%)',
            }}
          />

          {/* Watch frame */}
          <div
            className="relative w-80 h-[380px] mx-5 flex flex-col items-center justify-center rounded-[92px] bg-gray-950"
            style={{
              boxShadow: `
                inset 0 0 24px 1px #0d0d0d,
                inset 0 0 0 12px #606c78,
                0 20px 30px #00000071
              `,
              padding: '28px 26px',
            }}
          >
            {/* Frame shine border */}
            <div
              className="absolute rounded-[80px]"
              style={{
                border: '1px solid #0d0d0d',
                boxShadow: `
                  0 0 12px rgba(255, 255, 255, 0.5),
                  inset 0 0 12px 2px rgba(255, 255, 255, 0.75)
                `,
                height: '356px',
                width: '18.625rem',
                top: '12px',
                left: '12px',
              }}
            />

            {/* Time display */}
            <div
              className="relative z-10 text-center font-serif font-black text-[10rem] leading-[0.8]"
              style={{
                color: '#dddf8f',
                textShadow: '0 0 40px #d7d886c7',
              }}
            >
              <div>09</div>
              <div>55</div>
            </div>
          </div>

          {/* Side button (physical button on right) */}
          <div
            className="absolute rounded-lg z-[9]"
            style={{
              background: '#606c78',
              borderLeft: '1px solid #000',
              borderRadius: '8px 6px 6px 8px / 20px 6px 6px 20px',
              boxShadow: `
                inset 8px 0 8px 0 #1c1f23,
                inset -2px 0 6px #272c31,
                -4px 0 8px #0d0d0d40
              `,
              height: '72px',
              width: '18px',
              right: '6px',
              top: '108px',
            }}
          >
            {/* Button grooves */}
            <div
              style={{
                background: '#272c31',
                borderRadius: '20%',
                boxShadow: `
                  0 -30px rgba(62, 70, 77, 0.75),
                  0 -27px #272c31,
                  0 -25px #000,
                  0 -21px rgba(62, 70, 77, 0.75),
                  0 -18px #272c31,
                  0 -16px #000,
                  0 -12px rgba(62, 70, 77, 0.75),
                  0 -9px #272c31,
                  0 -7px #000,
                  0 -3px rgba(62, 70, 77, 0.75),
                  0 0 #272c31,
                  0 2px #000,
                  0 6px rgba(62, 70, 77, 0.75),
                  0 9px #272c31,
                  0 11px #000,
                  0 15px rgba(62, 70, 77, 0.75),
                  0 18px #272c31,
                  0 20px #000,
                  0 24px rgba(62, 70, 77, 0.75),
                  0 27px #272c31,
                  0 29px #000
                `,
                height: '3px',
                width: '10px',
                position: 'absolute',
                right: '2px',
                top: '50%',
                marginTop: '-2px',
                zIndex: 9,
              }}
            />

            {/* Button inner shadow */}
            <div
              className="absolute"
              style={{
                background: '#16181b',
                borderRadius: '2px 4px 4px 2px / 20px 8px 8px 20px',
                boxShadow: `
                  inset -2px 0 2px 0 #000,
                  inset -6px 0 18px #272c31
                `,
                height: '72px',
                width: '6px',
                right: '0',
                top: '0',
              }}
            />
          </div>

          {/* Power button */}
          <div
            className="absolute rounded-sm z-[9]"
            style={{
              background: '#272c31',
              borderRadius: '2px 4px 4px 2px / 2px 8px 8px 2px',
              boxShadow: 'inset 0 0 2px 1px #101315',
              height: '72px',
              width: '4px',
              right: '18px',
              top: '212px',
            }}
          />

          {/* Dots indicator */}
          <div
            className="absolute left-1/2 flex flex-col items-center gap-0"
            style={{
              bottom: '0',
              transform: 'translate(-50%, 140%)',
              padding: '3px',
              zIndex: 20,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-[17px] aspect-square bg-black rounded-full"
                style={{
                  marginBottom: '50px',
                  boxShadow: 'inset 2px 0 5px #ffffff48',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
