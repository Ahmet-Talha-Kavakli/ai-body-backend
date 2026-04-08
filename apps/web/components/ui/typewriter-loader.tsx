'use client'

import React from 'react'

export function TypewriterLoader() {
  return (
    <div className="relative animate-bounce">
      <style>{`
        .typewriter {
          position: relative;
          animation: bounce05 3s linear infinite;
        }

        .typewriter .slide {
          width: 92px;
          height: 20px;
          border-radius: 3px;
          margin-left: 14px;
          transform: translateX(14px);
          background: linear-gradient(#5C86FF, #275EFE);
          animation: slide05 3s ease infinite;
          position: relative;
        }

        .typewriter .slide:before {
          content: "";
          position: absolute;
          width: 2px;
          height: 8px;
          top: 6px;
          left: 100%;
          background: #FBC56C;
        }

        .typewriter .slide:after {
          content: "";
          position: absolute;
          left: 94px;
          top: 3px;
          height: 14px;
          width: 6px;
          border-radius: 3px;
          background: #FBC56C;
        }

        .typewriter .slide i {
          display: block;
          position: absolute;
          right: 100%;
          width: 6px;
          height: 4px;
          top: 4px;
          background: #FBC56C;
        }

        .typewriter .slide i:before {
          content: "";
          position: absolute;
          right: 100%;
          top: -2px;
          width: 4px;
          height: 14px;
          border-radius: 2px;
          background: #FBC56C;
        }

        .typewriter .paper {
          position: absolute;
          left: 24px;
          top: -26px;
          width: 40px;
          height: 46px;
          border-radius: 5px;
          background: #EEF0FD;
          transform: translateY(46px);
          animation: paper05 3s linear infinite;
        }

        .typewriter .paper:before {
          content: "";
          position: absolute;
          left: 6px;
          right: 6px;
          top: 7px;
          border-radius: 2px;
          height: 4px;
          transform: scaleY(0.8);
          background: #D3D4EC;
          box-shadow: 0 12px 0 #D3D4EC, 0 24px 0 #D3D4EC, 0 36px 0 #D3D4EC;
        }

        .typewriter .keyboard {
          width: 120px;
          height: 56px;
          margin-top: -10px;
          z-index: 1;
          position: relative;
        }

        .typewriter .keyboard:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 7px;
          background: linear-gradient(135deg, #5C86FF, #275EFE);
          transform: perspective(10px) rotateX(2deg);
          transform-origin: 50% 100%;
        }

        .typewriter .keyboard:after {
          content: "";
          position: absolute;
          left: 2px;
          top: 25px;
          width: 11px;
          height: 4px;
          border-radius: 2px;
          background: #fff;
          box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          animation: keyboard05 3s linear infinite;
        }

        @keyframes bounce05 {
          85%, 92%, 100% {
            transform: translateY(0);
          }
          89% {
            transform: translateY(-4px);
          }
          95% {
            transform: translateY(2px);
          }
        }

        @keyframes slide05 {
          5% {
            transform: translateX(14px);
          }
          15%, 30% {
            transform: translateX(6px);
          }
          40%, 55% {
            transform: translateX(0);
          }
          65%, 70% {
            transform: translateX(-4px);
          }
          80%, 89% {
            transform: translateX(-12px);
          }
          100% {
            transform: translateX(14px);
          }
        }

        @keyframes paper05 {
          5% {
            transform: translateY(46px);
          }
          20%, 30% {
            transform: translateY(34px);
          }
          40%, 55% {
            transform: translateY(22px);
          }
          65%, 70% {
            transform: translateY(10px);
          }
          80%, 85% {
            transform: translateY(0);
          }
          92%, 100% {
            transform: translateY(46px);
          }
        }

        @keyframes keyboard05 {
          5%, 12%, 21%, 30%, 39%, 48%, 57%, 66%, 75%, 84% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
          9% {
            box-shadow: 15px 2px 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
          18% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 2px 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
          27% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 12px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
          36% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 12px 0 #fff, 60px 12px 0 #fff, 68px 12px 0 #fff, 83px 10px 0 #fff;
          }
          45% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 2px 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
          54% {
            box-shadow: 15px 0 0 #fff, 30px 2px 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
          63% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 12px 0 #fff;
          }
          72% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 2px 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 10px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
          81% {
            box-shadow: 15px 0 0 #fff, 30px 0 0 #fff, 45px 0 0 #fff, 60px 0 0 #fff, 75px 0 0 #fff, 90px 0 0 #fff, 22px 10px 0 #fff, 37px 12px 0 #fff, 52px 10px 0 #fff, 60px 10px 0 #fff, 68px 10px 0 #fff, 83px 10px 0 #fff;
          }
        }
      `}</style>

      <div className="typewriter">
        <div className="slide">
          <i />
        </div>
        <div className="paper" />
        <div className="keyboard" />
      </div>
    </div>
  )
}
