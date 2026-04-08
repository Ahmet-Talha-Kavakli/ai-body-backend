
import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div id="wifi-loader">
        <svg className="circle-outer" viewBox="0 0 86 86">
          <circle className="back" cx={43} cy={43} r={40} />
          <circle className="front" cx={43} cy={43} r={40} />
          <circle className="new" cx={43} cy={43} r={40} />
        </svg>
        <svg className="circle-middle" viewBox="0 0 60 60">
          <circle className="back" cx={30} cy={30} r={27} />
          <circle className="front" cx={30} cy={30} r={27} />
        </svg>
        <svg className="circle-inner" viewBox="0 0 34 34">
          <circle className="back" cx={17} cy={17} r={14} />
          <circle className="front" cx={17} cy={17} r={14} />
        </svg>
        <div className="text" data-text="Searching" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  #wifi-loader {
    --background: #62abff;
    --front-color: #4f29f0;
    --back-color: #c3c8de;
    --text-color: #414856;
    width: 64px;
    height: 64px;
    border-radius: 50px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #wifi-loader svg {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #wifi-loader svg circle {
    position: absolute;
    fill: none;
    stroke-width: 6px;
    stroke-linecap: round;
    stroke-linejoin: round;
    transform: rotate(-100deg);
    transform-origin: center;
  }

  #wifi-loader svg circle.back {
    stroke: var(--back-color);
  }

  #wifi-loader svg circle.front {
    stroke: var(--front-color);
  }

  #wifi-loader svg.circle-outer {
    height: 86px;
    width: 86px;
  }

  #wifi-loader svg.circle-outer circle {
    stroke-dasharray: 62.75 188.25;
  }

  #wifi-loader svg.circle-outer circle.back {
    animation: circle-outer135 1.8s ease infinite 0.3s;
  }

  #wifi-loader svg.circle-outer circle.front {
    animation: circle-outer135 1.8s ease infinite 0.15s;
  }

  #wifi-loader svg.circle-middle {
    height: 60px;
    width: 60px;
  }

  #wifi-loader svg.circle-middle circle {
    stroke-dasharray: 42.5 127.5;
  }

  #wifi-loader svg.circle-middle circle.back {
    animation: circle-middle6123 1.8s ease infinite 0.25s;
  }

  #wifi-loader svg.circle-middle circle.front {
    animation: circle-middle6123 1.8s ease infinite 0.1s;
  }

  #wifi-loader svg.circle-inner {
    height: 34px;
    width: 34px;
  }

  #wifi-loader svg.circle-inner circle {
    stroke-dasharray: 22 66;
  }

  #wifi-loader svg.circle-inner circle.back {
    animation: circle-inner162 1.8s ease infinite 0.2s;
  }

  #wifi-loader svg.circle-inner circle.front {
    animation: circle-inner162 1.8s ease infinite 0.05s;
  }

  #wifi-loader .text {
    position: absolute;
    bottom: -40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-transform: lowercase;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.2px;
  }

  #wifi-loader .text::before, #wifi-loader .text::after {
    content: attr(data-text);
  }

  #wifi-loader .text::before {
    color: var(--text-color);
  }

  #wifi-loader .text::after {
    color: var(--front-color);
    animation: text-animation76 3.6s ease infinite;
    position: absolute;
    left: 0;
  }

  @keyframes circle-outer135 {
    0% {
      stroke-dashoffset: 25;
    }

    25% {
      stroke-dashoffset: 0;
    }

    65% {
      stroke-dashoffset: 301;
    }

    80% {
      stroke-dashoffset: 276;
    }

    100% {
      stroke-dashoffset: 276;
    }
  }

  @keyframes circle-middle6123 {
    0% {
      stroke-dashoffset: 17;
    }

    25% {
      stroke-dashoffset: 0;
    }

    65% {
      stroke-dashoffset: 204;
    }

    80% {
      stroke-dashoffset: 187;
    }

    100% {
      stroke-dashoffset: 187;
    }
  }

  @keyframes circle-inner162 {
    0% {
      stroke-dashoffset: 9;
    }

    25% {
      stroke-dashoffset: 0;
    }

    65% {
      stroke-dashoffset: 106;
    }

    80% {
      stroke-dashoffset: 97;
    }

    100% {
      stroke-dashoffset: 97;
    }
  }

  @keyframes text-animation76 {
    0% {
      clip-path: inset(0 100% 0 0);
    }

    50% {
      clip-path: inset(0);
    }

    100% {
      clip-path: inset(0 0 0 100%);
    }
  }`;

export default Loader;


15:

import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <button className="button">
        <div className="bg" />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 342 208" height={208} width={342} className="splash">
          <path strokeLinecap="round" strokeWidth={3} d="M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362" />
          <path strokeLinecap="round" strokeWidth={3} d="M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893" />
          <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272" />
          <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449" />
          <path strokeLinecap="round" strokeWidth={3} d="M230.578 57.4476C230.578 57.4476 225.785 41.5051 236.061 30.4998C246.337 19.4945 244.686 12.9998 244.686 12.9998" />
          <path strokeLinecap="round" strokeWidth={3} d="M230.578 150.528C230.578 150.528 225.785 166.471 236.061 177.476C246.337 188.481 244.686 194.976 244.686 194.976" />
          <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M170.392 57.0278C170.392 57.0278 173.89 42.1322 169.571 29.54C165.252 16.9478 168.751 2.05227 168.751 2.05227" />
          <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M170.392 150.948C170.392 150.948 173.89 165.844 169.571 178.436C165.252 191.028 168.751 205.924 168.751 205.924" />
          <path strokeLinecap="round" strokeWidth={3} d="M112.609 57.4476C112.609 57.4476 117.401 41.5051 107.125 30.4998C96.8492 19.4945 98.5 12.9998 98.5 12.9998" />
          <path strokeLinecap="round" strokeWidth={3} d="M112.609 150.528C112.609 150.528 117.401 166.471 107.125 177.476C96.8492 188.481 98.5 194.976 98.5 194.976" />
          <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M62.2941 64.9917C62.2941 64.9917 55.4671 49.8089 40.4932 48.2295C25.5194 46.6501 23.7159 36.5272 23.7159 36.5272" />
          <path strokeLinecap="round" strokeWidth={3} strokeOpacity="0.3" d="M62.2941 145.984C62.2941 145.984 55.4671 161.167 40.4932 162.746C25.5194 164.326 23.7159 174.449 23.7159 174.449" />
        </svg>
        <div className="wrap">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 221 42" height={42} width={221} className="path">
            <path strokeLinecap="round" strokeWidth={3} d="M182.674 2H203C211.837 2 219 9.16344 219 18V24C219 32.8366 211.837 40 203 40H18C9.16345 40 2 32.8366 2 24V18C2 9.16344 9.16344 2 18 2H47.8855" />
          </svg>
          <div className="outline" />
          <div className="content">
            <span className="char state-1">
              <span data-label="J" style={{-i: 1}}>J</span>
              <span data-label="o" style={{-i: 2}}>o</span>
              <span data-label="i" style={{-i: 3}}>i</span>
              <span data-label="n" style={{-i: 4}}>n</span>
              <span data-label="T" style={{-i: 5}}>T</span>
              <span data-label="o" style={{-i: 6}}>o</span>
              <span data-label="d" style={{-i: 7}}>d</span>
              <span data-label="a" style={{-i: 8}}>a</span>
              <span data-label="y" style={{-i: 9}}>y</span>
            </span>
            <div className="icon">
              <div />
            </div>
            <span className="char state-2">
              <span data-label="J" style={{-i: 1}}>J</span>
              <span data-label="o" style={{-i: 2}}>o</span>
              <span data-label="i" style={{-i: 3}}>i</span>
              <span data-label="n" style={{-i: 4}}>n</span>
              <span data-label="N" style={{-i: 5}}>N</span>
              <span data-label="o" style={{-i: 6}}>o</span>
              <span data-label="w" style={{-i: 7}}>w</span>
            </span>
          </div>
        </div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    --white: #ffe7ff;
    --purple-100: #f4b1fd;
    --purple-200: #d190ff;
    --purple-300: #c389f2;
    --purple-400: #8e26e2;
    --purple-500: #5e2b83;
    --radius: 18px;

    border-radius: var(--radius);
    outline: none;
    cursor: pointer;
    font-size: 23px;
    font-family: Arial;
    background: transparent;
    letter-spacing: -1px;
    border: 0;
    position: relative;
    width: 220px;
    height: 80px;
    transform: rotate(353deg) skewX(4deg);
  }

  .bg {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    filter: blur(1px);
  }
  .bg::before,
  .bg::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: calc(var(--radius) * 1.1);
    background: var(--purple-500);
  }
  .bg::before {
    filter: blur(5px);
    transition: all 0.3s ease;
    box-shadow:
      -7px 6px 0 0 rgb(115 75 155 / 40%),
      -14px 12px 0 0 rgb(115 75 155 / 30%),
      -21px 18px 4px 0 rgb(115 75 155 / 25%),
      -28px 24px 8px 0 rgb(115 75 155 / 15%),
      -35px 30px 12px 0 rgb(115 75 155 / 12%),
      -42px 36px 16px 0 rgb(115 75 155 / 8%),
      -56px 42px 20px 0 rgb(115 75 155 / 5%);
  }

  .wrap {
    border-radius: inherit;
    overflow: hidden;
    height: 100%;
    transform: translate(6px, -6px);
    padding: 3px;
    background: linear-gradient(
      to bottom,
      var(--purple-100) 0%,
      var(--purple-400) 100%
    );
    position: relative;
    transition: all 0.3s ease;
  }

  .outline {
    position: absolute;
    overflow: hidden;
    inset: 0;
    opacity: 0;
    outline: none;
    border-radius: inherit;
    transition: all 0.4s ease;
  }
  .outline::before {
    content: "";
    position: absolute;
    inset: 2px;
    width: 120px;
    height: 300px;
    margin: auto;
    background: linear-gradient(
      to right,
      transparent 0%,
      white 50%,
      transparent 100%
    );
    animation: spin 3s linear infinite;
    animation-play-state: paused;
  }

  .content {
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    position: relative;
    height: 100%;
    gap: 16px;
    border-radius: calc(var(--radius) * 0.85);
    font-weight: 600;
    transition: all 0.3s ease;
    background: linear-gradient(
      to bottom,
      var(--purple-300) 0%,
      var(--purple-400) 100%
    );
    box-shadow:
      inset -2px 12px 11px -5px var(--purple-200),
      inset 1px -3px 11px 0px rgb(0 0 0 / 35%);
  }
  .content::before {
    content: "";
    inset: 0;
    position: absolute;
    z-index: 10;
    width: 80%;
    top: 45%;
    bottom: 35%;
    opacity: 0.7;
    margin: auto;
    background: linear-gradient(to bottom, transparent, var(--purple-400));
    filter: brightness(1.3) blur(5px);
  }

  .char {
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .char span {
    display: block;
    color: transparent;
    position: relative;
  }
  .char span:nth-child(5) {
    margin-left: 5px;
  }
  .char.state-1 span:nth-child(5) {
    margin-right: -3px;
  }
  .char.state-1 span {
    animation: charAppear 1.2s ease backwards calc(var(--i) * 0.03s);
  }
  .char.state-1 span::before,
  .char span::after {
    content: attr(data-label);
    position: absolute;
    color: var(--white);
    text-shadow: -1px 1px 2px var(--purple-500);
    left: 0;
  }
  .char span::before {
    opacity: 0;
    transform: translateY(-100%);
  }
  .char.state-2 {
    position: absolute;
    left: 80px;
  }
  .char.state-2 span::after {
    opacity: 1;
  }

  .icon {
    animation: resetArrow 0.8s cubic-bezier(0.7, -0.5, 0.3, 1.2) forwards;
    z-index: 10;
  }
  .icon div,
  .icon div::before,
  .icon div::after {
    height: 3px;
    border-radius: 1px;
    background-color: var(--white);
  }
  .icon div::before,
  .icon div::after {
    content: "";
    position: absolute;
    right: 0;
    transform-origin: center right;
    width: 14px;
    border-radius: 15px;
    transition: all 0.3s ease;
  }
  .icon div {
    position: relative;
    width: 24px;
    box-shadow: -2px 2px 5px var(--purple-400);
    transform: scale(0.9);
    background: linear-gradient(to bottom, var(--white), var(--purple-100));
    animation: swingArrow 1s ease-in-out infinite;
    animation-play-state: paused;
  }
  .icon div::before {
    transform: rotate(44deg);
    top: 1px;
    box-shadow: 1px -2px 3px -1px var(--purple-400);
    animation: rotateArrowLine 1s linear infinite;
    animation-play-state: paused;
  }
  .icon div::after {
    bottom: 1px;
    transform: rotate(316deg);
    box-shadow: -2px 2px 3px 0 var(--purple-400);
    background: linear-gradient(200deg, var(--white), var(--purple-100));
    animation: rotateArrowLine2 1s linear infinite;
    animation-play-state: paused;
  }

  .path {
    position: absolute;
    z-index: 12;
    bottom: 0;
    left: 0;
    right: 0;
    stroke-dasharray: 150 480;
    stroke-dashoffset: 150;
    pointer-events: none;
  }

  .splash {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    stroke-dasharray: 60 60;
    stroke-dashoffset: 60;
    transform: translate(-17%, -31%);
    stroke: var(--purple-300);
  }

  /** STATES */

  .button:hover .words {
    opacity: 1;
  }
  .button:hover .words span {
    animation-play-state: running;
  }

  .button:hover .char.state-1 span::before {
    animation: charAppear 0.7s ease calc(var(--i) * 0.03s);
  }

  .button:hover .char.state-1 span::after {
    opacity: 1;
    animation: charDisappear 0.7s ease calc(var(--i) * 0.03s);
  }

  .button:hover .wrap {
    transform: translate(8px, -8px);
  }

  .button:hover .outline {
    opacity: 1;
  }

  .button:hover .outline::before,
  .button:hover .icon div::before,
  .button:hover .icon div::after,
  .button:hover .icon div {
    animation-play-state: running;
  }

  .button:active .bg::before {
    filter: blur(5px);
    opacity: 0.7;
    box-shadow:
      -7px 6px 0 0 rgb(115 75 155 / 40%),
      -14px 12px 0 0 rgb(115 75 155 / 25%),
      -21px 18px 4px 0 rgb(115 75 155 / 15%);
  }
  .button:active .content {
    box-shadow:
      inset -1px 12px 8px -5px rgba(71, 0, 137, 0.4),
      inset 0px -3px 8px 0px var(--purple-200);
  }

  .button:active .words,
  .button:active .outline {
    opacity: 0;
  }

  .button:active .wrap {
    transform: translate(3px, -3px);
  }

  .button:active .splash {
    animation: splash 0.8s cubic-bezier(0.3, 0, 0, 1) forwards 0.05s;
  }

  .button:focus .path {
    animation: path 1.6s ease forwards 0.2s;
  }

  .button:focus .icon {
    animation: arrow 1s cubic-bezier(0.7, -0.5, 0.3, 1.5) forwards;
  }

  .char.state-2 span::after,
  .button:focus .char.state-1 span {
    animation: charDisappear 0.5s ease forwards calc(var(--i) * 0.03s);
  }

  .button:focus .char.state-2 span::after {
    animation: charAppear 1s ease backwards calc(var(--i) * 0.03s);
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes charAppear {
    0% {
      transform: translateY(50%);
      opacity: 0;
      filter: blur(20px);
    }
    20% {
      transform: translateY(70%);
      opacity: 1;
    }
    50% {
      transform: translateY(-15%);
      opacity: 1;
      filter: blur(0);
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes charDisappear {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(-70%);
      opacity: 0;
      filter: blur(3px);
    }
  }

  @keyframes arrow {
    0% {
      opacity: 1;
    }
    50% {
      transform: translateX(60px);
      opacity: 0;
    }
    51% {
      transform: translateX(-200px);
      opacity: 0;
    }
    100% {
      transform: translateX(-128px);
      opacity: 1;
    }
  }

  @keyframes swingArrow {
    50% {
      transform: translateX(5px) scale(0.9);
    }
  }

  @keyframes rotateArrowLine {
    50% {
      transform: rotate(30deg);
    }
    80% {
      transform: rotate(55deg);
    }
  }

  @keyframes rotateArrowLine2 {
    50% {
      transform: rotate(330deg);
    }
    80% {
      transform: rotate(300deg);
    }
  }

  @keyframes resetArrow {
    0% {
      transform: translateX(-128px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes path {
    from {
      stroke: white;
    }
    to {
      stroke-dashoffset: -480;
      stroke: #f9c6fe;
    }
  }

  @keyframes splash {
    to {
      stroke-dasharray: 2 60;
      stroke-dashoffset: -60;
    }
  }`;

export default Button;


16:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <div>
          <ul>
            <li>
              <svg fill="currentColor" viewBox="0 0 90 120">
                <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
              </svg>
            </li>
            <li>
              <svg fill="currentColor" viewBox="0 0 90 120">
                <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
              </svg>
            </li>
            <li>
              <svg fill="currentColor" viewBox="0 0 90 120">
                <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
              </svg>
            </li>
            <li>
              <svg fill="currentColor" viewBox="0 0 90 120">
                <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
              </svg>
            </li>
            <li>
              <svg fill="currentColor" viewBox="0 0 90 120">
                <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
              </svg>
            </li>
            <li>
              <svg fill="currentColor" viewBox="0 0 90 120">
                <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
              </svg>
            </li>
          </ul>
        </div><span>Loading</span></div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    --background: linear-gradient(135deg, #23C4F8, #275EFE);
    --shadow: rgba(39, 94, 254, 0.28);
    --text: #6C7486;
    --page: rgba(255, 255, 255, 0.36);
    --page-fold: rgba(255, 255, 255, 0.52);
    --duration: 3s;
    width: 200px;
    height: 140px;
    position: relative;
  }

  .loader:before, .loader:after {
    --r: -6deg;
    content: "";
    position: absolute;
    bottom: 8px;
    width: 120px;
    top: 80%;
    box-shadow: 0 16px 12px var(--shadow);
    transform: rotate(var(--r));
  }

  .loader:before {
    left: 4px;
  }

  .loader:after {
    --r: 6deg;
    right: 4px;
  }

  .loader div {
    width: 100%;
    height: 100%;
    border-radius: 13px;
    position: relative;
    z-index: 1;
    perspective: 600px;
    box-shadow: 0 4px 6px var(--shadow);
    background-image: var(--background);
  }

  .loader div ul {
    margin: 0;
    padding: 0;
    list-style: none;
    position: relative;
  }

  .loader div ul li {
    --r: 180deg;
    --o: 0;
    --c: var(--page);
    position: absolute;
    top: 10px;
    left: 10px;
    transform-origin: 100% 50%;
    color: var(--c);
    opacity: var(--o);
    transform: rotateY(var(--r));
    -webkit-animation: var(--duration) ease infinite;
    animation: var(--duration) ease infinite;
  }

  .loader div ul li:nth-child(2) {
    --c: var(--page-fold);
    -webkit-animation-name: page-2;
    animation-name: page-2;
  }

  .loader div ul li:nth-child(3) {
    --c: var(--page-fold);
    -webkit-animation-name: page-3;
    animation-name: page-3;
  }

  .loader div ul li:nth-child(4) {
    --c: var(--page-fold);
    -webkit-animation-name: page-4;
    animation-name: page-4;
  }

  .loader div ul li:nth-child(5) {
    --c: var(--page-fold);
    -webkit-animation-name: page-5;
    animation-name: page-5;
  }

  .loader div ul li svg {
    width: 90px;
    height: 120px;
    display: block;
  }

  .loader div ul li:first-child {
    --r: 0deg;
    --o: 1;
  }

  .loader div ul li:last-child {
    --o: 1;
  }

  .loader span {
    display: block;
    left: 0;
    right: 0;
    top: 100%;
    margin-top: 20px;
    text-align: center;
    color: var(--text);
  }

  @keyframes page-2 {
    0% {
      transform: rotateY(180deg);
      opacity: 0;
    }

    20% {
      opacity: 1;
    }

    35%, 100% {
      opacity: 0;
    }

    50%, 100% {
      transform: rotateY(0deg);
    }
  }

  @keyframes page-3 {
    15% {
      transform: rotateY(180deg);
      opacity: 0;
    }

    35% {
      opacity: 1;
    }

    50%, 100% {
      opacity: 0;
    }

    65%, 100% {
      transform: rotateY(0deg);
    }
  }

  @keyframes page-4 {
    30% {
      transform: rotateY(180deg);
      opacity: 0;
    }

    50% {
      opacity: 1;
    }

    65%, 100% {
      opacity: 0;
    }

    80%, 100% {
      transform: rotateY(0deg);
    }
  }

  @keyframes page-5 {
    45% {
      transform: rotateY(180deg);
      opacity: 0;
    }

    65% {
      opacity: 1;
    }

    80%, 100% {
      opacity: 0;
    }

    95%, 100% {
      transform: rotateY(0deg);
    }
  }`;

export default Loader;


17:

import React from 'react';

const Card = () => {
  return (
    <section className="relative group flex flex-col items-center justify-center w-full h-full">
      <div className="file relative w-60 h-40 cursor-pointer origin-bottom [perspective:1500px] z-50">
        <div className="work-5 bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]" />
        <div className="work-4 absolute inset-1 bg-zinc-400 rounded-2xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]" />
        <div className="work-3 absolute inset-1 bg-zinc-300 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]" />
        <div className="work-2 absolute inset-1 bg-zinc-200 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]" />
        <div className="work-1 absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[156px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[146px] after:h-[16px] after:bg-amber-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[10px] before:right-[142px] before:size-3 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);] transition-all ease duration-300 origin-bottom flex items-end group-hover:shadow-[inset_0_20px_40px_#fbbf24,_inset_0_-20px_40px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]" />
      </div>
      <p className="text-3xl pt-4 opacity-20">Hover over</p>
    </section>
  );
}

export default Card;


18:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="typewriter">
        <div className="slide"><i /></div>
        <div className="paper" />
        <div className="keyboard" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .typewriter {
    --blue: #5C86FF;
    --blue-dark: #275EFE;
    --key: #fff;
    --paper: #EEF0FD;
    --text: #D3D4EC;
    --tool: #FBC56C;
    --duration: 3s;
    position: relative;
    -webkit-animation: bounce05 var(--duration) linear infinite;
    animation: bounce05 var(--duration) linear infinite;
  }

  .typewriter .slide {
    width: 92px;
    height: 20px;
    border-radius: 3px;
    margin-left: 14px;
    transform: translateX(14px);
    background: linear-gradient(var(--blue), var(--blue-dark));
    -webkit-animation: slide05 var(--duration) ease infinite;
    animation: slide05 var(--duration) ease infinite;
  }

  .typewriter .slide:before, .typewriter .slide:after,
  .typewriter .slide i:before {
    content: "";
    position: absolute;
    background: var(--tool);
  }

  .typewriter .slide:before {
    width: 2px;
    height: 8px;
    top: 6px;
    left: 100%;
  }

  .typewriter .slide:after {
    left: 94px;
    top: 3px;
    height: 14px;
    width: 6px;
    border-radius: 3px;
  }

  .typewriter .slide i {
    display: block;
    position: absolute;
    right: 100%;
    width: 6px;
    height: 4px;
    top: 4px;
    background: var(--tool);
  }

  .typewriter .slide i:before {
    right: 100%;
    top: -2px;
    width: 4px;
    border-radius: 2px;
    height: 14px;
  }

  .typewriter .paper {
    position: absolute;
    left: 24px;
    top: -26px;
    width: 40px;
    height: 46px;
    border-radius: 5px;
    background: var(--paper);
    transform: translateY(46px);
    -webkit-animation: paper05 var(--duration) linear infinite;
    animation: paper05 var(--duration) linear infinite;
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
    background: var(--text);
    box-shadow: 0 12px 0 var(--text), 0 24px 0 var(--text), 0 36px 0 var(--text);
  }

  .typewriter .keyboard {
    width: 120px;
    height: 56px;
    margin-top: -10px;
    z-index: 1;
    position: relative;
  }

  .typewriter .keyboard:before, .typewriter .keyboard:after {
    content: "";
    position: absolute;
  }

  .typewriter .keyboard:before {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 7px;
    background: linear-gradient(135deg, var(--blue), var(--blue-dark));
    transform: perspective(10px) rotateX(2deg);
    transform-origin: 50% 100%;
  }

  .typewriter .keyboard:after {
    left: 2px;
    top: 25px;
    width: 11px;
    height: 4px;
    border-radius: 2px;
    box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    -webkit-animation: keyboard05 var(--duration) linear infinite;
    animation: keyboard05 var(--duration) linear infinite;
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
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }

    9% {
      box-shadow: 15px 2px 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }

    18% {
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 2px 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }

    27% {
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 12px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }

    36% {
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 12px 0 var(--key), 60px 12px 0 var(--key), 68px 12px 0 var(--key), 83px 10px 0 var(--key);
    }

    45% {
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 2px 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }

    54% {
      box-shadow: 15px 0 0 var(--key), 30px 2px 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }

    63% {
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 12px 0 var(--key);
    }

    72% {
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 2px 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 10px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }

    81% {
      box-shadow: 15px 0 0 var(--key), 30px 0 0 var(--key), 45px 0 0 var(--key), 60px 0 0 var(--key), 75px 0 0 var(--key), 90px 0 0 var(--key), 22px 10px 0 var(--key), 37px 12px 0 var(--key), 52px 10px 0 var(--key), 60px 10px 0 var(--key), 68px 10px 0 var(--key), 83px 10px 0 var(--key);
    }
  }`;

export default Loader;


19:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <svg xmlns="http://www.w3.org/2000/svg" height="200px" width="200px" viewBox="0 0 200 200" className="pencil">
        <defs>
          <clipPath id="pencil-eraser">
            <rect height={30} width={30} ry={5} rx={5} />
          </clipPath>
        </defs>
        <circle transform="rotate(-113,100,100)" strokeLinecap="round" strokeDashoffset="439.82" strokeDasharray="439.82 439.82" strokeWidth={2} stroke="currentColor" fill="none" r={70} className="pencil__stroke" />
        <g transform="translate(100,100)" className="pencil__rotate">
          <g fill="none">
            <circle transform="rotate(-90)" strokeDashoffset={402} strokeDasharray="402.12 402.12" strokeWidth={30} stroke="hsl(223,90%,50%)" r={64} className="pencil__body1" />
            <circle transform="rotate(-90)" strokeDashoffset={465} strokeDasharray="464.96 464.96" strokeWidth={10} stroke="hsl(223,90%,60%)" r={74} className="pencil__body2" />
            <circle transform="rotate(-90)" strokeDashoffset={339} strokeDasharray="339.29 339.29" strokeWidth={10} stroke="hsl(223,90%,40%)" r={54} className="pencil__body3" />
          </g>
          <g transform="rotate(-90) translate(49,0)" className="pencil__eraser">
            <g className="pencil__eraser-skew">
              <rect height={30} width={30} ry={5} rx={5} fill="hsl(223,90%,70%)" />
              <rect clipPath="url(#pencil-eraser)" height={30} width={5} fill="hsl(223,90%,60%)" />
              <rect height={20} width={30} fill="hsl(223,10%,90%)" />
              <rect height={20} width={15} fill="hsl(223,10%,70%)" />
              <rect height={20} width={5} fill="hsl(223,10%,80%)" />
              <rect height={2} width={30} y={6} fill="hsla(223,10%,10%,0.2)" />
              <rect height={2} width={30} y={13} fill="hsla(223,10%,10%,0.2)" />
            </g>
          </g>
          <g transform="rotate(-90) translate(49,-30)" className="pencil__point">
            <polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)" />
            <polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)" />
            <polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)" />
          </g>
        </g>
      </svg>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .pencil {
    display: block;
    width: 10em;
    height: 10em;
  }

  .pencil__body1,
  .pencil__body2,
  .pencil__body3,
  .pencil__eraser,
  .pencil__eraser-skew,
  .pencil__point,
  .pencil__rotate,
  .pencil__stroke {
    animation-duration: 3s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  .pencil__body1,
  .pencil__body2,
  .pencil__body3 {
    transform: rotate(-90deg);
  }

  .pencil__body1 {
    animation-name: pencilBody1;
  }

  .pencil__body2 {
    animation-name: pencilBody2;
  }

  .pencil__body3 {
    animation-name: pencilBody3;
  }

  .pencil__eraser {
    animation-name: pencilEraser;
    transform: rotate(-90deg) translate(49px,0);
  }

  .pencil__eraser-skew {
    animation-name: pencilEraserSkew;
    animation-timing-function: ease-in-out;
  }

  .pencil__point {
    animation-name: pencilPoint;
    transform: rotate(-90deg) translate(49px,-30px);
  }

  .pencil__rotate {
    animation-name: pencilRotate;
  }

  .pencil__stroke {
    animation-name: pencilStroke;
    transform: translate(100px,100px) rotate(-113deg);
  }

  /* Animations */
  @keyframes pencilBody1 {
    from,
  	to {
      stroke-dashoffset: 351.86;
      transform: rotate(-90deg);
    }

    50% {
      stroke-dashoffset: 150.8;
   /* 3/8 of diameter */
      transform: rotate(-225deg);
    }
  }

  @keyframes pencilBody2 {
    from,
  	to {
      stroke-dashoffset: 406.84;
      transform: rotate(-90deg);
    }

    50% {
      stroke-dashoffset: 174.36;
      transform: rotate(-225deg);
    }
  }

  @keyframes pencilBody3 {
    from,
  	to {
      stroke-dashoffset: 296.88;
      transform: rotate(-90deg);
    }

    50% {
      stroke-dashoffset: 127.23;
      transform: rotate(-225deg);
    }
  }

  @keyframes pencilEraser {
    from,
  	to {
      transform: rotate(-45deg) translate(49px,0);
    }

    50% {
      transform: rotate(0deg) translate(49px,0);
    }
  }

  @keyframes pencilEraserSkew {
    from,
  	32.5%,
  	67.5%,
  	to {
      transform: skewX(0);
    }

    35%,
  	65% {
      transform: skewX(-4deg);
    }

    37.5%, 
  	62.5% {
      transform: skewX(8deg);
    }

    40%,
  	45%,
  	50%,
  	55%,
  	60% {
      transform: skewX(-15deg);
    }

    42.5%,
  	47.5%,
  	52.5%,
  	57.5% {
      transform: skewX(15deg);
    }
  }

  @keyframes pencilPoint {
    from,
  	to {
      transform: rotate(-90deg) translate(49px,-30px);
    }

    50% {
      transform: rotate(-225deg) translate(49px,-30px);
    }
  }

  @keyframes pencilRotate {
    from {
      transform: translate(100px,100px) rotate(0);
    }

    to {
      transform: translate(100px,100px) rotate(720deg);
    }
  }

  @keyframes pencilStroke {
    from {
      stroke-dashoffset: 439.82;
      transform: translate(100px,100px) rotate(-113deg);
    }

    50% {
      stroke-dashoffset: 164.93;
      transform: translate(100px,100px) rotate(-113deg);
    }

    75%,
  	to {
      stroke-dashoffset: 439.82;
      transform: translate(100px,100px) rotate(112deg);
    }
  }`;

export default Loader;


20:

import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <button className="continue-application">
        <div>
          <div className="pencil" />
          <div className="folder">
            <div className="top">
              <svg viewBox="0 0 24 27">
                <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z" />
              </svg>
            </div>
            <div className="paper" />
          </div>
        </div>
        Continue Application
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .continue-application {
    --color: #fff;
    --background: #404660;
    --background-hover: #3A4059;
    --background-left: #2B3044;
    --folder: #F3E9CB;
    --folder-inner: #BEB393;
    --paper: #FFFFFF;
    --paper-lines: #BBC1E1;
    --paper-behind: #E1E6F9;
    --pencil-cap: #fff;
    --pencil-top: #275EFE;
    --pencil-middle: #fff;
    --pencil-bottom: #5C86FF;
    --shadow: rgba(13, 15, 25, .2);
    border: none;
    outline: none;
    cursor: pointer;
    position: relative;
    border-radius: 5px;
    font-size: 14px;
    font-weight: 500;
    line-height: 19px;
    -webkit-appearance: none;
    -webkit-tap-highlight-color: transparent;
    padding: 17px 29px 17px 69px;
    transition: background 0.3s;
    color: var(--color);
    background: var(--bg, var(--background));
  }

  .continue-application > div {
    top: 0;
    left: 0;
    bottom: 0;
    width: 53px;
    position: absolute;
    overflow: hidden;
    border-radius: 5px 0 0 5px;
    background: var(--background-left);
  }

  .continue-application > div .folder {
    width: 23px;
    height: 27px;
    position: absolute;
    left: 15px;
    top: 13px;
  }

  .continue-application > div .folder .top {
    left: 0;
    top: 0;
    z-index: 2;
    position: absolute;
    transform: translateX(var(--fx, 0));
    transition: transform 0.4s ease var(--fd, 0.3s);
  }

  .continue-application > div .folder .top svg {
    width: 24px;
    height: 27px;
    display: block;
    fill: var(--folder);
    transform-origin: 0 50%;
    transition: transform 0.3s ease var(--fds, 0.45s);
    transform: perspective(120px) rotateY(var(--fr, 0deg));
  }

  .continue-application > div .folder:before, .continue-application > div .folder:after,
  .continue-application > div .folder .paper {
    content: "";
    position: absolute;
    left: var(--l, 0);
    top: var(--t, 0);
    width: var(--w, 100%);
    height: var(--h, 100%);
    border-radius: 1px;
    background: var(--b, var(--folder-inner));
  }

  .continue-application > div .folder:before {
    box-shadow: 0 1.5px 3px var(--shadow), 0 2.5px 5px var(--shadow), 0 3.5px 7px var(--shadow);
    transform: translateX(var(--fx, 0));
    transition: transform 0.4s ease var(--fd, 0.3s);
  }

  .continue-application > div .folder:after,
  .continue-application > div .folder .paper {
    --l: 1px;
    --t: 1px;
    --w: 21px;
    --h: 25px;
    --b: var(--paper-behind);
  }

  .continue-application > div .folder:after {
    transform: translate(var(--pbx, 0), var(--pby, 0));
    transition: transform 0.4s ease var(--pbd, 0s);
  }

  .continue-application > div .folder .paper {
    z-index: 1;
    --b: var(--paper);
  }

  .continue-application > div .folder .paper:before, .continue-application > div .folder .paper:after {
    content: "";
    width: var(--wp, 14px);
    height: 2px;
    border-radius: 1px;
    transform: scaleY(0.5);
    left: 3px;
    top: var(--tp, 3px);
    position: absolute;
    background: var(--paper-lines);
    box-shadow: 0 12px 0 0 var(--paper-lines), 0 24px 0 0 var(--paper-lines);
  }

  .continue-application > div .folder .paper:after {
    --tp: 6px;
    --wp: 10px;
  }

  .continue-application > div .pencil {
    height: 2px;
    width: 3px;
    border-radius: 1px 1px 0 0;
    top: 8px;
    left: 105%;
    position: absolute;
    z-index: 3;
    transform-origin: 50% 19px;
    background: var(--pencil-cap);
    transform: translateX(var(--pex, 0)) rotate(35deg);
    transition: transform 0.4s ease var(--pbd, 0s);
  }

  .continue-application > div .pencil:before, .continue-application > div .pencil:after {
    content: "";
    position: absolute;
    display: block;
    background: var(--b, linear-gradient(var(--pencil-top) 55%, var(--pencil-middle) 55.1%, var(--pencil-middle) 60%, var(--pencil-bottom) 60.1%));
    width: var(--w, 5px);
    height: var(--h, 20px);
    border-radius: var(--br, 2px 2px 0 0);
    top: var(--t, 2px);
    left: var(--l, -1px);
  }

  .continue-application > div .pencil:before {
    -webkit-clip-path: polygon(0 5%, 5px 5%, 5px 17px, 50% 20px, 0 17px);
    clip-path: polygon(0 5%, 5px 5%, 5px 17px, 50% 20px, 0 17px);
  }

  .continue-application > div .pencil:after {
    --b: none;
    --w: 3px;
    --h: 6px;
    --br: 0 2px 1px 0;
    --t: 3px;
    --l: 3px;
    border-top: 1px solid var(--pencil-top);
    border-right: 1px solid var(--pencil-top);
  }

  .continue-application:before, .continue-application:after {
    content: "";
    position: absolute;
    width: 10px;
    height: 2px;
    border-radius: 1px;
    background: var(--color);
    transform-origin: 9px 1px;
    transform: translateX(var(--cx, 0)) scale(0.5) rotate(var(--r, -45deg));
    top: 26px;
    right: 16px;
    transition: transform 0.3s;
  }

  .continue-application:after {
    --r: 45deg;
  }

  .continue-application:hover {
    --cx: 2px;
    --bg: var(--background-hover);
    --fx: -40px;
    --fr: -60deg;
    --fd: .15s;
    --fds: 0s;
    --pbx: 3px;
    --pby: -3px;
    --pbd: .15s;
    --pex: -24px;
  }`;

export default Button;


21:

import React from 'react';

const Button = () => {
  return (
    <button className="bg-white text-center w-48 rounded-2xl h-14 relative text-black text-xl font-semibold group" type="button">
      <div className="bg-green-400 rounded-xl h-12 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="25px" width="25px">
          <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#000000" />
          <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="#000000" />
        </svg>
      </div>
      <p className="translate-x-2">Go Back</p>
    </button>
  );
}

export default Button;


22:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <svg width={100} height={100} viewBox="0 0 100 100">
          <defs>
            <mask id="clipping">
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />
              <polygon points="25,25 75,25 50,75" fill="white" />
              <polygon points="50,25 75,75 25,75" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
            </mask>
          </defs>
        </svg>
        <div className="box" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    --color-one: #ffbf48;
    --color-two: #be4a1d;
    --color-three: #ffbf4780;
    --color-four: #bf4a1d80;
    --color-five: #ffbf4740;
    --time-animation: 2s;
    --size: 1; /* You can change the size */
    position: relative;
    border-radius: 50%;
    transform: scale(var(--size));
    box-shadow:
      0 0 25px 0 var(--color-three),
      0 20px 50px 0 var(--color-four);
    animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
  }

  .loader::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border-top: solid 1px var(--color-one);
    border-bottom: solid 1px var(--color-two);
    background: linear-gradient(180deg, var(--color-five), var(--color-four));
    box-shadow:
      inset 0 10px 10px 0 var(--color-three),
      inset 0 -10px 10px 0 var(--color-four);
  }

  .loader .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(
      180deg,
      var(--color-one) 30%,
      var(--color-two) 70%
    );
    mask: url(#clipping);
    -webkit-mask: url(#clipping);
  }

  .loader svg {
    position: absolute;
  }

  .loader svg #clipping {
    filter: contrast(15);
    animation: roundness calc(var(--time-animation) / 2) linear infinite;
  }

  .loader svg #clipping polygon {
    filter: blur(7px);
  }

  .loader svg #clipping polygon:nth-child(1) {
    transform-origin: 75% 25%;
    transform: rotate(90deg);
  }

  .loader svg #clipping polygon:nth-child(2) {
    transform-origin: 50% 50%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(3) {
    transform-origin: 50% 60%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -3);
  }

  .loader svg #clipping polygon:nth-child(4) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(5) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
    animation-delay: calc(var(--time-animation) / -2);
  }

  .loader svg #clipping polygon:nth-child(6) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
  }

  .loader svg #clipping polygon:nth-child(7) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -1.5);
  }

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
  }`;

export default Loader;


