
import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <label className="folder-card">
        <input type="checkbox" className="folder-toggle" />
        <div className="hint-wrapper">
          <span className="hint-text">Click to open</span>
          <svg className="hint-arrow" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 35 5 C 35 5, 15 5, 10 25 M 10 25 L 3 18 M 10 25 L 18 22" stroke="#60a5fa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="folder-container">
          <svg className="folder-back" viewBox="0 0 50 40" fill="none">
            <path d="M0 4C0 1.79086 1.79086 0 4 0H16.524C17.721 0 18.8415 0.54051 19.574 1.4673L22.426 5.0654C23.1585 5.99219 24.279 6.5327 25.476 6.5327H46C48.2091 6.5327 50 8.32356 50 10.5327V36C50 38.2091 48.2091 40 46 40H4C1.79086 40 0 38.2091 0 36V4Z" fill="#0056b3" />
          </svg>
          <div className="folder-search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
              <circle cx={11} cy={11} r={8} />
              <line x1={21} y1={21} x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search files..." className="search-input" />
          </div>
          <div className="file file-5">
            <div className="shine" />
            <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div className="file-text">Hero_BG.png</div>
            <div className="file-tag">PNG • 4.2 MB</div>
          </div>
          <div className="file file-4">
            <div className="shine" />
            <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
            </svg>
            <div className="file-text">Promo_Cut.mp4</div>
            <div className="file-tag">MP4 • 128 MB</div>
          </div>
          <div className="file file-3">
            <div className="shine" />
            <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <div className="file-text">app_config.json</div>
            <div className="file-tag">JSON • 12 KB</div>
          </div>
          <div className="file file-2">
            <div className="shine" />
            <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1={16} y1={13} x2={8} y2={13} />
              <line x1={16} y1={17} x2={8} y2={17} />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div className="file-text">Q3_Report.pdf</div>
            <div className="file-tag">PDF • 1.1 MB</div>
          </div>
          <div className="file file-1">
            <div className="shine" />
            <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
              <line x1={8} y1={21} x2={16} y2={21} />
              <line x1={12} y1={17} x2={12} y2={21} />
            </svg>
            <div className="file-text">Pitch_Deck.pptx</div>
            <div className="file-tag">PPTX • 8.4 MB</div>
          </div>
          <div className="folder-front-wrapper">
            <svg className="folder-front" viewBox="0 0 50 34" fill="none">
              <path d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z" fill="rgba(0, 123, 255, 0.65)" />
            </svg>
            <div className="folder-label" />
            <div className="counter">
              <div className="status-dot" />
              <span className="counter-label">FILES</span>
              <span className="counter-number">05</span>
            </div>
          </div>
        </div>
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  /* Note: all animations will works when you click not hover, I use just active state to make the folder card stay open...  I Hope you like this design... */

  .folder-card {
    width: 170px;
    height: 130px;
    perspective: 1200px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }

  .folder-toggle {
    display: none;
  }

  /* hint text */
  .hint-wrapper {
    position: absolute;
    top: -40px;
    right: -50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
    pointer-events: none;
    z-index: 100;
    animation: floatHint 2.5s ease-in-out infinite;
  }

  .hint-text {
    font-family:
      "Inter",
      -apple-system,
      sans-serif;
    color: #60a5fa;
    font-size: 10px;
    font-weight: 900;
    text-decoration: underline;
    letter-spacing: 0.5px;
    white-space: nowrap;
    position: relative;
    right: -25px;
    top: 10px;
    transform: rotate(45deg);
  }
  .hint-arrow {
    height: 35px;
    width: 35px;
  }

  @keyframes floatHint {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(6px);
    }
  }

  .folder-toggle:checked ~ .hint-wrapper {
    opacity: 0;
    transform: translateY(-10px);
  }

  /* folder card logics are here */
  .folder-container {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
    backface-visibility: hidden;
    will-change: transform;
  }

  .folder-toggle:checked ~ .folder-container {
    transform: rotateX(10deg) rotateY(-5deg);
  }

  .folder-back {
    position: absolute;
    bottom: 0;
    width: 100%;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4));
  }

  .folder-front-wrapper {
    position: absolute;
    bottom: -7px;
    width: 100%;
    z-index: 90;
    transform-origin: bottom;
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border-radius: 12px;
  }

  .folder-label {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 30px;
    height: 4px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
  }

  /* this counts files  */
  .counter {
    position: absolute;
    top: -95px;
    right: -75px;
    background-color: #a18cd1;

    padding: 4px 8px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 8px;

    box-shadow:
      0 10px 20px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.2);
    transform: scale(0) translateY(20px);
    opacity: 0;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 100;
    pointer-events: auto;
  }

  .folder-toggle:checked ~ .folder-container .counter {
    transform: scale(1) translateY(0);
    opacity: 1;
    transition-delay: 0.2s;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background: #34d399;
    border-radius: 50%;
    position: relative;
    box-shadow: 0 0 10px #34d399;
  }

  .status-dot::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #34d399;
    border-radius: 50%;
    animation: pulse 2s infinite;
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

  .counter-label {
    font-family: "Inter", sans-serif;
    font-size: 8px;
    font-weight: 800;
    color: black;
    text-transform: capitalize;
  }

  .counter-number {
    font-family: "Inter", sans-serif;
    font-size: 12px;
    font-weight: 900;
    color: #ffffff;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  .counter:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: #60a5fa;
    transform: scale(1.1) translateY(-5px) !important;
    cursor: help;
  }

  .counter:hover .counter-number {
    color: #60a5fa;
    transition: color 0.3s ease;
  }

  /* files with <hidden secrects /> */
  .file {
    position: absolute;
    bottom: 5px;
    left: 10%;
    width: 80%;
    height: 85px;
    border-radius: 6px;
    overflow: hidden;
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 0;
  }

  .file-1 {
    background: #ff5f6d;
    z-index: 25;
    transition-delay: 0.15s;
  }
  .file-2 {
    background: #ffc371;
    z-index: 24;
    transition-delay: 0.1s;
  }
  .file-3 {
    background: #4facfe;
    z-index: 23;
    transition-delay: 0.05s;
  }
  .file-4 {
    background: #00f2fe;
    z-index: 22;
    transition-delay: 0.02s;
  }
  .file-5 {
    background: #a18cd1;
    z-index: 21;
    transition-delay: 0s;
  }

  .shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    transform: skewX(-20deg);
    transition: none;
  }

  .folder-toggle:checked ~ .folder-container .shine {
    left: 150%;
    transition: left 0.8s ease-in-out;
    transition-delay: 0.3s;
  }

  .file-text {
    font-family: "Inter", sans-serif;
    font-size: 9px;
    color: white;
    padding: 12px;
    font-weight: 800;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translateY(5px);
    transition: all 0.3s ease 0.4s;
  }

  .folder-toggle:checked ~ .folder-container .file-text {
    opacity: 1;
    transform: translateY(0);
  }

  /* active state (click on card folder) */
  .folder-toggle:checked ~ .folder-container .folder-front-wrapper {
    transform: rotateX(-50deg);
  }

  .folder-toggle:checked ~ .folder-container .file-1 {
    transform: translateY(-70px) rotate(-10deg) translateX(-15px) translateZ(20px);
  }
  .folder-toggle:checked ~ .folder-container .file-2 {
    transform: translateY(-55px) rotate(8deg) translateX(18px) translateZ(10px);
  }
  .folder-toggle:checked ~ .folder-container .file-3 {
    transform: translateY(-40px) rotate(-15deg) translateX(-8px);
  }
  .folder-toggle:checked ~ .folder-container .file-4 {
    transform: translateY(-25px) rotate(12deg) translateX(12px);
  }
  .folder-toggle:checked ~ .folder-container .file-5 {
    transform: translateY(-10px) rotate(-5deg);
  }

  /*  Hover Interaction */
  .folder-toggle:checked ~ .folder-container .file:hover {
    cursor: pointer;
    filter: brightness(1.1);
  }

  .folder-toggle:checked ~ .folder-container .file-1:hover {
    transform: translateY(-80px) rotate(-10deg) translateX(-15px) translateZ(20px);
  }
  .folder-toggle:checked ~ .folder-container .file-2:hover {
    transform: translateY(-65px) rotate(8deg) translateX(18px) translateZ(10px);
  }
  .folder-toggle:checked ~ .folder-container .file-3:hover {
    transform: translateY(-50px) rotate(-15deg) translateX(-8px);
  }
  .folder-toggle:checked ~ .folder-container .file-4:hover {
    transform: translateY(-35px) rotate(12deg) translateX(12px);
  }
  .folder-toggle:checked ~ .folder-container .file-5:hover {
    transform: translateY(-20px) rotate(-5deg);
  }

  /* extras styles for files  */
  .file-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 14px;
    height: 14px;
    color: rgba(255, 255, 255, 0.4);
    transition: color 0.3s ease;
  }

  .file-tag {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    color: rgba(255, 255, 255, 0.9);
    font-family:
      "Inter",
      -apple-system,
      sans-serif;
    font-size: 7px;
    font-weight: 700;
    padding: 3px 6px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translateX(10px);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
  }

  /* when folder is OPEN and you HOVER a file */
  .folder-toggle:checked ~ .folder-container .file:hover .file-icon {
    color: rgba(255, 255, 255, 0.9);
  }
  .folder-toggle:checked ~ .folder-container .file-tag {
    opacity: 1;
  }

  /* search bar */
  .folder-search {
    position: absolute;
    top: -40px;
    left: 10%;
    width: 30px;
    height: 25px;
    background-color: #60a5fa;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 20px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    opacity: 0;
    z-index: 100;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .search-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .search-input {
    background: transparent;
    border: none;
    color: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 9px;
    margin-left: 8px;
    outline: none;
    transition: width 0.4s ease;
  }
  .search-input::placeholder {
    color: #ffffff;
  }

  .folder-toggle:checked ~ .folder-container .folder-search {
    opacity: 1;
    top: -80px;
    width: 80%;
  }

  .folder-toggle:checked ~ .folder-container .folder-search:focus-within {
    width: 90%;
    background-color: #ff3b30;
  }

  .folder-toggle:checked
    ~ .folder-container
    .folder-search:focus-within
    .search-input {
    width: 100%;
  }`;

export default Card;


36:

import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <button className="Btn">
        Jelly Button
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .Btn {
    position: relative;
    width: 150px;
    height: 55px;
    border-radius: 45px;
    border: none;
    background-color: rgb(151, 95, 255);
    color: white;
    box-shadow: 0px 10px 10px rgb(210, 187, 253) inset,
    0px 5px 10px rgba(5, 5, 5, 0.212),
    0px -10px 10px rgb(124, 54, 255) inset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .Btn::before {
    width: 70%;
    height: 2px;
    position: absolute;
    background-color: rgba(250, 250, 250, 0.678);
    content: "";
    filter: blur(1px);
    top: 7px;
    border-radius: 50%;
  }

  .Btn::after {
    width: 70%;
    height: 2px;
    position: absolute;
    background-color: rgba(250, 250, 250, 0.137);
    content: "";
    filter: blur(1px);
    bottom: 7px;
    border-radius: 50%;
  }

  .Btn:hover {
    animation: jello-horizontal 0.9s both;
  }

  @keyframes jello-horizontal {
    0% {
      transform: scale3d(1, 1, 1);
    }

    30% {
      transform: scale3d(1.25, 0.75, 1);
    }

    40% {
      transform: scale3d(0.75, 1.25, 1);
    }

    50% {
      transform: scale3d(1.15, 0.85, 1);
    }

    65% {
      transform: scale3d(0.95, 1.05, 1);
    }

    75% {
      transform: scale3d(1.05, 0.95, 1);
    }

    100% {
      transform: scale3d(1, 1, 1);
    }
  }`;

export default Button;


37:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div>
        <svg className="svg">
          <path className="path" />
        </svg>
        <svg>
          <path />
        </svg>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .body {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .svg {
    position: absolute;
    width: 400px;
    fill: none;
  }

  .svg:nth-child(2) {
    filter: blur(40px);
  }

  .svg path {
    d: path("M0,25 C150,110 150, -60 300,25");
    stroke: #ff0092;
    stroke-width: 50;
    stroke-linecap: round;
    transform: translate(50px,50%);
    animation: animate 2s ease-in-out infinite;
  }

  @keyframes animate {
    0% {
      stroke: greenyellow;
      stroke: #ff0092;
      d: path("M0,25 C150,110 150, -60 300,25");
    }

    50% {
      stroke: dodgerblue;
      stroke: #00ff00;
      d: path("M0,25 C160,-50 140, 110 300,25");
    }
  }`;

export default Loader;


38:

import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <button>
        <b>Fold me!</b>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    position: relative;
    font-size: 1.2em;
    padding: 0.7em 1.4em;
    background-color: #BF0426;
    text-decoration: none;
    border: none;
    border-radius: 0.5em;
    color: #DEDEDE;
    box-shadow: 0.5em 0.5em 0.5em rgba(0, 0, 0, 0.3);
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

  button:active {
    box-shadow: 0.2em 0.2em 0.3em rgba(0, 0, 0, 0.3);
    transform: translate(0.1em, 0.1em);
  }`;

export default Button;


39:

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

40:

import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="watch">
        <div className="frame">
          <div className="text">
            <div>09</div>
            <div>55</div>
          </div>
        </div>
        <div className="sideBtn" />
        <div className="powerBtn" />
        <div className="dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .watch {
    position: relative;
    transform: scale(0.7);
  }
  .watch::after,
  .watch::before {
    content: "";
    width: 10rem;
    height: 200px;
    background: radial-gradient(circle at 200px, rgb(0, 0, 0), rgb(48, 48, 48));
    box-shadow: inset 0px -10px 18px #ffffffb9, 10px 0px 30px #00000071;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0%);
  }
  .watch::before {
    content: "";
    width: 10rem;
    height: 200px;
    background: radial-gradient(circle at 200px, rgb(0, 0, 0), rgb(48, 48, 48));
    box-shadow: inset 0px 10px 18px #ffffffb9, 10px 0px 30px #00000071;
    position: absolute;
    left: 50%;
    transform: translate(-50%, -100%);
  }
  .dots {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 140%);
    padding: 3px;
    z-index: 20;
  }
  .dots .dot {
    width: 17px;
    aspect-ratio: 1;
    background-color: #000000;
    border-radius: 100px;
    display: block;
    margin-bottom: 50px;
    box-shadow: inset 2px 0 5px #ffffff48;
  }
  .frame {
    background: #0d0d0d;
    border-radius: 92px;
    box-shadow: inset 0 0 24px 1px #0d0d0d, inset 0 0 0 12px #606c78,
      0 20px 30px #00000071;
    height: 380px;
    margin: 0 20px;
    padding: 28px 26px;
    position: relative;
    width: 20rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .text {
    color: #dddf8f;
    font-size: 10rem;
    font-family: serif;
    font-weight: bolder;
    line-height: 0.8;
    text-shadow: 0 0 40px #d7d886c7;
  }
  .frame::before {
    border: 1px solid #0d0d0d;
    border-radius: 80px;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.5),
      inset 0 0 12px 2px rgba(255, 255, 255, 0.75);
    content: "";
    height: 356px;
    left: 12px;
    position: absolute;
    top: 12px;
    width: 18.625rem;
  }
  .sideBtn {
    background: #606c78;
    border-left: 1px solid #000;
    border-radius: 8px 6px 6px 8px / 20px 6px 6px 20px;
    box-shadow: inset 8px 0 8px 0 #1c1f23, inset -2px 0 6px #272c31,
      -4px 0 8px #0d0d0d40;
    height: 72px;
    position: absolute;
    right: 6px;
    top: 108px;
    width: 18px;
    z-index: 9;
  }
  .sideBtn::before {
    background: #272c31;
    border-radius: 20%;
    box-shadow: 0 -30px rgba(62, 70, 77, 0.75), 0 -27px #272c31, 0 -25px #000,
      0 -21px rgba(62, 70, 77, 0.75), 0 -18px #272c31, 0 -16px #000,
      0 -12px rgba(62, 70, 77, 0.75), 0 -9px #272c31, 0 -7px #000,
      0 -3px rgba(62, 70, 77, 0.75), 0 0 #272c31, 0 2px #000,
      0 6px rgba(62, 70, 77, 0.75), 0 9px #272c31, 0 11px #000,
      0 15px rgba(62, 70, 77, 0.75), 0 18px #272c31, 0 20px #000,
      0 24px rgba(62, 70, 77, 0.75), 0 27px #272c31, 0 29px #000;
    content: "";
    height: 3px;
    margin-top: -2px;
    position: absolute;
    right: 2px;
    top: 50%;
    width: 10px;
    z-index: 9;
  }
  .sideBtn::after {
    background: #16181b;
    border-radius: 2px 4px 4px 2px / 20px 8px 8px 20px;
    box-shadow: inset -2px 0 2px 0 #000, inset -6px 0 18px #272c31;
    content: "";
    height: 72px;
    position: absolute;
    right: 0;
    top: 0;
    width: 6px;
  }

  .powerBtn {
    background: #272c31;
    border-radius: 2px 4px 4px 2px / 2px 8px 8px 2px;
    box-shadow: inset 0 0 2px 1px #101315;
    height: 72px;
    position: absolute;
    right: 18px;
    top: 212px;
    width: 4px;
  }`;

export default Card;


41:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div>
        <svg style={{position: 'absolute', width: 0, height: 0}}>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={12} />
            <feColorMatrix values="0 0 0 0 0 
            0 0 0 0 0 
            0 0 0 0 0 
            0 0 0 48 -7" />
          </filter>
        </svg>
        <div className="loader" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    width: 12em;
    height: 3em;
    position: relative;
    overflow: hidden;
    border-bottom: 8px solid #000;
    filter: url(#goo);
  }

  .loader::before {
    content: '';
    width: 22em;
    height: 18em;
    background: #f00;
    position: absolute;
    border-radius: 50%;
    left: -2em;
    bottom: -18em;
    animation: wee1 2s linear infinite;
  }

  .loader::after {
    content: '';
    width: 16em;
    height: 12em;
    background: #0ff;
    position: absolute;
    border-radius: 50%;
    left: -4em;
    bottom: -12em;
    animation: wee2 2s linear infinite 0.75s;
  }

  @keyframes wee1 {
    0% {
      transform: translateX(-10em) rotate(0deg);
    }

    100% {
      transform: translateX(7em) rotate(180deg);
    }
  }

  @keyframes wee2 {
    0% {
      transform: translateX(-8em) rotate(0deg);
    }

    100% {
      transform: translateX(8em) rotate(180deg);
    }
  }`;

export default Loader;


42:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div>
        <div className="container">
          <div className="dot dot-1" />
          <div className="dot dot-2" />
          <div className="dot dot-3" />
        </div>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="goo">
              <feGaussianBlur result="blur" stdDeviation={10} in="SourceGraphic" />
              <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7" mode="matrix" in="blur" />
            </filter>
          </defs>
        </svg>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    width: 200px;
    height: 200px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: auto;
    filter: url("#goo");
    animation: rotate-move 2s ease-in-out infinite;
  }

  .dot {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #000;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
  }

  .dot-3 {
    background-color: #ff1717;
    animation: dot-3-move 2s ease infinite, index 6s ease infinite;
  }

  .dot-2 {
    background-color: #0051ff;
    animation: dot-2-move 2s ease infinite, index 6s -4s ease infinite;
  }

  .dot-1 {
    background-color: #ffc400;
    animation: dot-1-move 2s ease infinite, index 6s -2s ease infinite;
  }

  @keyframes dot-3-move {
    20% {
      transform: scale(1);
    }
    45% {
      transform: translateY(-18px) scale(0.45);
    }
    60% {
      transform: translateY(-90px) scale(0.45);
    }
    80% {
      transform: translateY(-90px) scale(0.45);
    }
    100% {
      transform: translateY(0px) scale(1);
    }
  }

  @keyframes dot-2-move {
    20% {
      transform: scale(1);
    }
    45% {
      transform: translate(-16px, 12px) scale(0.45);
    }
    60% {
      transform: translate(-80px, 60px) scale(0.45);
    }
    80% {
      transform: translate(-80px, 60px) scale(0.45);
    }
    100% {
      transform: translateY(0px) scale(1);
    }
  }

  @keyframes dot-1-move {
    20% {
      transform: scale(1);
    }
    45% {
      transform: translate(16px, 12px) scale(0.45);
    }
    60% {
      transform: translate(80px, 60px) scale(0.45);
    }
    80% {
      transform: translate(80px, 60px) scale(0.45);
    }
    100% {
      transform: translateY(0px) scale(1);
    }
  }

  @keyframes rotate-move {
    55% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    80% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  @keyframes index {
    0%,
    100% {
      z-index: 3;
    }
    33.3% {
      z-index: 2;
    }
    66.6% {
      z-index: 1;
    }
  }`;

export default Loader;


43:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="macbook">
        <div className="inner">
          <div className="screen">
            <div className="face-one">
              <div className="camera" />
              <div className="display">
                <div className="shade" />
              </div>
              <span>MacBook Air</span>
            </div>
            <title>Layer 1</title>
          </div>
          <div className="macbody">
            <div className="face-one">
              <div className="touchpad">
              </div>
              <div className="keyboard">
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key space" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
                <div className="key f" />
              </div>
            </div>
            <div className="pad one" />
            <div className="pad two" />
            <div className="pad three" />
            <div className="pad four" />
          </div>
        </div>
        <div className="shadow" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .macbook {
    width: 150px;
    height: 96px;
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -85px 0 0 -78px;
    perspective: 500px;
  }

  .shadow {
    position: absolute;
    width: 60px;
    height: 0px;
    left: 40px;
    top: 160px;
    transform: rotateX(80deg) rotateY(0deg) rotateZ(0deg);
    box-shadow: 0 0 60px 40px rgba(0,0,0,0.3);
    animation: shadow infinite 7s ease;
  }

  .inner {
    z-index: 20;
    position: absolute;
    width: 150px;
    height: 96px;
    left: 0;
    top: 0;
    transform-style: preserve-3d;
    transform: rotateX(-20deg) rotateY(0deg) rotateZ(0deg);
    animation: rotate infinite 7s ease;
  }

  .screen {
    width: 150px;
    height: 96px;
    position: absolute;
    left: 0;
    bottom: 0;
    border-radius: 7px;
    background: #ddd;
    transform-style: preserve-3d;
    transform-origin: 50% 93px;
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    animation: lid-screen infinite 7s ease;
    background-image: linear-gradient(45deg, rgba(0,0,0,0.34) 0%,rgba(0,0,0,0) 100%);
    background-position: left bottom;
    background-size: 300px 300px;
    box-shadow: inset 0 3px 7px rgba(255,255,255,0.5);
  }

  .screen .logo {
    position: absolute;
    width: 20px;
    height: 24px;
    left: 50%;
    top: 50%;
    margin: -12px 0 0 -10px;
    transform: rotateY(180deg) translateZ(0.1px);
  }

  .screen .face-one {
    width: 150px;
    height: 96px;
    position: absolute;
    left: 0;
    bottom: 0;
    border-radius: 7px;
    background: #d3d3d3;
    transform: translateZ(2px);
    background-image: linear-gradient(45deg,rgba(0,0,0,0.24) 0%,rgba(0,0,0,0) 100%);
  }

  .screen .face-one .camera {
    width: 3px;
    height: 3px;
    border-radius: 100%;
    background: #000;
    position: absolute;
    left: 50%;
    top: 4px;
    margin-left: -1.5px;
  }

  .screen .face-one .display {
    width: 130px;
    height: 74px;
    margin: 10px;
    background-color: #000;
    background-size: 100% 100%;
    border-radius: 1px;
    position: relative;
    box-shadow: inset 0 0 2px rgba(0,0,0,1);
  }

  .screen .face-one .display .shade {
    position: absolute;
    left: 0;
    top: 0;
    width: 130px;
    height: 74px;
    background: linear-gradient(-135deg, rgba(255,255,255,0) 0%,rgba(255,255,255,0.1) 47%,rgba(255,255,255,0) 48%);
    animation: screen-shade infinite 7s ease;
    background-size: 300px 200px;
    background-position: 0px 0px;
  }

  .screen .face-one span {
    position: absolute;
    top: 85px;
    left: 57px;
    font-size: 6px;
    color: #666
  }

  .macbody {
    width: 150px;
    height: 96px;
    position: absolute;
    left: 0;
    bottom: 0;
    border-radius: 7px;
    background: #cbcbcb;
    transform-style: preserve-3d;
    transform-origin: 50% bottom;
    transform: rotateX(-90deg);
    animation: lid-macbody infinite 7s ease;
    background-image: linear-gradient(45deg, rgba(0,0,0,0.24) 0%,rgba(0,0,0,0) 100%);
  }

  .macbody .face-one {
    width: 150px;
    height: 96px;
    position: absolute;
    left: 0;
    bottom: 0;
    border-radius: 7px;
    transform-style: preserve-3d;
    background: #dfdfdf;
    animation: lid-keyboard-area infinite 7s ease;
    transform: translateZ(-2px);
    background-image: linear-gradient(30deg, rgba(0,0,0,0.24) 0%,rgba(0,0,0,0) 100%);
  }

  .macbody .touchpad {
    width: 40px;
    height: 31px;
    position: absolute;
    left: 50%;
    top: 50%;
    border-radius: 4px;
    margin: -44px 0 0 -18px;
    background: #cdcdcd;
    background-image: linear-gradient(30deg, rgba(0,0,0,0.24) 0%,rgba(0,0,0,0) 100%);
    box-shadow: inset 0 0 3px #888;
  }

  .macbody .keyboard {
    width: 130px;
    height: 45px;
    position: absolute;
    left: 7px;
    top: 41px;
    border-radius: 4px;
    transform-style: preserve-3d;
    background: #cdcdcd;
    background-image: linear-gradient(30deg, rgba(0,0,0,0.24) 0%,rgba(0,0,0,0) 100%);
    box-shadow: inset 0 0 3px #777;
    padding: 0 0 0 2px;
  }

  .keyboard .key {
    width: 6px;
    height: 6px;
    background: #444;
    float: left;
    margin: 1px;
    transform: translateZ(-2px);
    border-radius: 2px;
    box-shadow: 0 -2px 0 #222;
    animation: keys infinite 7s ease;
  }

  .key.space {
    width: 45px;
  }

  .key.f {
    height: 3px;
  }

  .macbody .pad {
    width: 5px;
    height: 5px;
    background: #333;
    border-radius: 100%;
    position: absolute;
  }

  .pad.one {
    left: 20px;
    top: 20px;
  }

  .pad.two {
    right: 20px;
    top: 20px;
  }

  .pad.three {
    right: 20px;
    bottom: 20px;
  }

  .pad.four {
    left: 20px;
    bottom: 20px;
  }

  @keyframes rotate {
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

  @keyframes lid-screen {
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

  @keyframes lid-macbody {
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

  @keyframes lid-keyboard-area {
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

  @keyframes screen-shade {
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

  @keyframes keys {
    0% {
      box-shadow: 0 -2px 0 #222;
    }

    5% {
      box-shadow: 1 -1px 0 #222;
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

  @keyframes shadow {
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
  }`;

export default Loader;

