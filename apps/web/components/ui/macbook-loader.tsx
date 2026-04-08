'use client'

import React from 'react'

export function MacbookLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div
        className="relative w-[150px] h-[96px]"
        style={{
          perspective: '500px',
          margin: '-85px 0 0 -78px',
          left: '50%',
          top: '50%',
        }}
      >
        {/* Main inner container */}
        <div
          className="absolute z-20 w-[150px] h-[96px]"
          style={{
            transformStyle: 'preserve-3d',
            animation: 'rotateDevice 7s ease infinite',
          }}
        >
          {/* Screen */}
          <div
            className="absolute w-[150px] h-[96px] rounded-lg bg-gray-300 bottom-0 left-0"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: '50% 93px',
              animation: 'lidScreen 7s ease infinite',
              backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0) 100%)',
              backgroundPosition: 'left bottom',
              backgroundSize: '300px 300px',
              boxShadow: 'inset 0 3px 7px rgba(255,255,255,0.5)',
            }}
          >
            {/* Screen face */}
            <div
              className="absolute w-[150px] h-[96px] rounded-lg bg-gray-200 bottom-0 left-0"
              style={{
                transform: 'translateZ(2px)',
                backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 100%)',
              }}
            >
              {/* Camera */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-black left-1/2 top-1 -translate-x-1/2" />

              {/* Display */}
              <div
                className="absolute w-[130px] h-[74px] mx-2.5 my-2.5 bg-black rounded-sm"
                style={{
                  boxShadow: 'inset 0 0 2px rgba(0,0,0,1)',
                }}
              >
                {/* Screen shade */}
                <div
                  className="absolute inset-0 w-[130px] h-[74px]"
                  style={{
                    background: 'linear-gradient(-135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 47%, rgba(255,255,255,0) 48%)',
                    animation: 'screenShade 7s ease infinite',
                    backgroundSize: '300px 200px',
                    backgroundPosition: '0px 0px',
                  }}
                />
              </div>

              {/* MacBook Air text */}
              <span className="absolute text-[6px] text-gray-600 bottom-[11px] left-[57px]">
                MacBook Air
              </span>
            </div>
          </div>

          {/* MacBook body */}
          <div
            className="absolute w-[150px] h-[96px] rounded-lg bg-gray-400 bottom-0 left-0"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: '50% bottom',
              animation: 'lidMacbody 7s ease infinite',
              backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 100%)',
            }}
          >
            {/* Keyboard area */}
            <div
              className="absolute w-[150px] h-[96px] rounded-lg bottom-0 left-0 bg-gray-300"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(-2px)',
                animation: 'lidKeyboardArea 7s ease infinite',
                backgroundImage: 'linear-gradient(30deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 100%)',
              }}
            >
              {/* Touchpad */}
              <div
                className="absolute w-10 h-[31px] rounded-md bg-gray-400 left-1/2 top-1/2"
                style={{
                  margin: '-44px 0 0 -18px',
                  backgroundImage: 'linear-gradient(30deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 100%)',
                  boxShadow: 'inset 0 0 3px #888',
                }}
              />

              {/* Keyboard */}
              <div
                className="absolute w-[130px] h-[45px] rounded-md bg-gray-400 flex flex-wrap content-start gap-0.5 p-0.5"
                style={{
                  left: '7px',
                  top: '41px',
                  transformStyle: 'preserve-3d',
                  backgroundImage: 'linear-gradient(30deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 100%)',
                  boxShadow: 'inset 0 0 3px #777',
                }}
              >
                {/* Regular keys */}
                {[...Array(60)].map((_, i) => (
                  <div
                    key={`key-${i}`}
                    className="w-1.5 h-1.5 bg-gray-700 rounded m-0.5 flex-shrink-0"
                    style={{
                      transform: 'translateZ(-2px)',
                      boxShadow: '0 -2px 0 #222',
                      animation: 'keyboardPress 7s ease infinite',
                    }}
                  />
                ))}

                {/* Space key */}
                <div
                  className="h-1.5 bg-gray-700 rounded m-0.5"
                  style={{
                    width: '45px',
                    transform: 'translateZ(-2px)',
                    boxShadow: '0 -2px 0 #222',
                    animation: 'keyboardPress 7s ease infinite',
                  }}
                />

                {/* Function keys */}
                {[...Array(16)].map((_, i) => (
                  <div
                    key={`fkey-${i}`}
                    className="w-1.5 h-0.75 bg-gray-700 rounded m-0.5 flex-shrink-0"
                    style={{
                      transform: 'translateZ(-2px)',
                      boxShadow: '0 -2px 0 #222',
                      animation: 'keyboardPress 7s ease infinite',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Pads (rubber feet) */}
            {[
              { top: '20px', left: '20px' },
              { top: '20px', right: '20px' },
              { bottom: '20px', right: '20px' },
              { bottom: '20px', left: '20px' },
            ].map((pos, i) => (
              <div
                key={`pad-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-gray-800"
                style={{
                  ...pos,
                }}
              />
            ))}
          </div>
        </div>

        {/* Shadow */}
        <div
          className="absolute w-[60px] h-0"
          style={{
            left: '40px',
            top: '160px',
            boxShadow: '0 0 60px 40px rgba(0,0,0,0.3)',
            animation: 'shadowMove 7s ease infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes rotateDevice {
          0% {
            transform: rotateX(-20deg) rotateY(0deg) rotateZ(0deg);
          }
          5% {
            transform: rotateX(-20deg) rotateY(-20deg) rotateZ(0deg);
          }
          20% {
            transform: rotateX(30deg) rotateY(200deg) rotateZ(0deg);
          }
          25% {
            transform: rotateX(-60deg) rotateY(150deg) rotateZ(0deg);
          }
          60% {
            transform: rotateX(-20deg) rotateY(130deg) rotateZ(0deg);
          }
          65% {
            transform: rotateX(-20deg) rotateY(120deg) rotateZ(0deg);
          }
          80% {
            transform: rotateX(-20deg) rotateY(375deg) rotateZ(0deg);
          }
          85% {
            transform: rotateX(-20deg) rotateY(357deg) rotateZ(0deg);
          }
          87% {
            transform: rotateX(-20deg) rotateY(360deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(-20deg) rotateY(360deg) rotateZ(0deg);
          }
        }

        @keyframes lidScreen {
          0% {
            transform: rotateX(0deg);
            background-position: left bottom;
          }
          5% {
            transform: rotateX(50deg);
            background-position: left bottom;
          }
          20% {
            transform: rotateX(-90deg);
            background-position: -150px top;
          }
          25% {
            transform: rotateX(15deg);
            background-position: left bottom;
          }
          30% {
            transform: rotateX(-5deg);
            background-position: right top;
          }
          38% {
            transform: rotateX(5deg);
            background-position: right top;
          }
          48% {
            transform: rotateX(0deg);
            background-position: right top;
          }
          90% {
            transform: rotateX(0deg);
            background-position: right top;
          }
          100% {
            transform: rotateX(0deg);
            background-position: right center;
          }
        }

        @keyframes lidMacbody {
          0% {
            transform: rotateX(-90deg);
          }
          50% {
            transform: rotateX(-90deg);
          }
          100% {
            transform: rotateX(-90deg);
          }
        }

        @keyframes lidKeyboardArea {
          0% {
            background-color: #dfdfdf;
          }
          50% {
            background-color: #bbb;
          }
          100% {
            background-color: #dfdfdf;
          }
        }

        @keyframes screenShade {
          0% {
            background-position: -20px 0px;
          }
          5% {
            background-position: -40px 0px;
          }
          20% {
            background-position: 200px 0;
          }
          50% {
            background-position: -200px 0;
          }
          80% {
            background-position: 0px 0px;
          }
          85% {
            background-position: -30px 0;
          }
          90% {
            background-position: -20px 0;
          }
          100% {
            background-position: -20px 0px;
          }
        }

        @keyframes keyboardPress {
          0% {
            box-shadow: 0 -2px 0 #222;
          }
          5% {
            box-shadow: 1px -1px 0 #222;
          }
          20% {
            box-shadow: -1px 1px 0 #222;
          }
          25% {
            box-shadow: -1px 1px 0 #222;
          }
          60% {
            box-shadow: -1px 1px 0 #222;
          }
          80% {
            box-shadow: 0 -2px 0 #222;
          }
          85% {
            box-shadow: 0 -2px 0 #222;
          }
          87% {
            box-shadow: 0 -2px 0 #222;
          }
          100% {
            box-shadow: 0 -2px 0 #222;
          }
        }

        @keyframes shadowMove {
          0% {
            transform: rotateX(80deg) rotateY(0deg) rotateZ(0deg);
            box-shadow: 0 0 60px 40px rgba(0,0,0,0.3);
          }
          5% {
            transform: rotateX(80deg) rotateY(10deg) rotateZ(0deg);
            box-shadow: 0 0 60px 40px rgba(0,0,0,0.3);
          }
          20% {
            transform: rotateX(30deg) rotateY(-20deg) rotateZ(-20deg);
            box-shadow: 0 0 50px 30px rgba(0,0,0,0.3);
          }
          25% {
            transform: rotateX(80deg) rotateY(-20deg) rotateZ(50deg);
            box-shadow: 0 0 35px 15px rgba(0,0,0,0.1);
          }
          60% {
            transform: rotateX(80deg) rotateY(0deg) rotateZ(-50deg) translateX(30px);
            box-shadow: 0 0 60px 40px rgba(0,0,0,0.3);
          }
          100% {
            box-shadow: 0 0 60px 40px rgba(0,0,0,0.3);
          }
        }
      `}</style>
    </div>
  )
}
