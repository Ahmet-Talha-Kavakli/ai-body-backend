
import React from 'react';
import styled from 'styled-components';

const Checkbox = () => {
  return (
    <StyledWrapper>
      <label className="neon-checkbox">
        <input type="checkbox" />
        <div className="neon-checkbox__frame">
          <div className="neon-checkbox__box">
            <div className="neon-checkbox__check-container">
              <svg viewBox="0 0 24 24" className="neon-checkbox__check">
                <path d="M3,12.5l7,7L21,5" />
              </svg>
            </div>
            <div className="neon-checkbox__glow" />
            <div className="neon-checkbox__borders">
              <span /><span /><span /><span />
            </div>
          </div>
          <div className="neon-checkbox__effects">
            <div className="neon-checkbox__particles">
              <span /><span /><span /><span /> <span /><span /><span /><span /> <span /><span /><span /><span />
            </div>
            <div className="neon-checkbox__rings">
              <div className="ring" />
              <div className="ring" />
              <div className="ring" />
            </div>
            <div className="neon-checkbox__sparks">
              <span /><span /><span /><span />
            </div>
          </div>
        </div>
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .neon-checkbox {
    --primary: #00ffaa;
    --primary-dark: #00cc88;
    --primary-light: #88ffdd;
    --size: 30px;
    position: relative;
    width: var(--size);
    height: var(--size);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .neon-checkbox input {
    display: none;
  }

  .neon-checkbox__frame {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .neon-checkbox__box {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 4px;
    border: 2px solid var(--primary-dark);
    transition: all 0.4s ease;
  }

  .neon-checkbox__check-container {
    position: absolute;
    inset: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .neon-checkbox__check {
    width: 80%;
    height: 80%;
    fill: none;
    stroke: var(--primary);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 40;
    stroke-dashoffset: 40;
    transform-origin: center;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .neon-checkbox__glow {
    position: absolute;
    inset: -2px;
    border-radius: 6px;
    background: var(--primary);
    opacity: 0;
    filter: blur(8px);
    transform: scale(1.2);
    transition: all 0.4s ease;
  }

  .neon-checkbox__borders {
    position: absolute;
    inset: 0;
    border-radius: 4px;
    overflow: hidden;
  }

  .neon-checkbox__borders span {
    position: absolute;
    width: 40px;
    height: 1px;
    background: var(--primary);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .neon-checkbox__borders span:nth-child(1) {
    top: 0;
    left: -100%;
    animation: borderFlow1 2s linear infinite;
  }

  .neon-checkbox__borders span:nth-child(2) {
    top: -100%;
    right: 0;
    width: 1px;
    height: 40px;
    animation: borderFlow2 2s linear infinite;
  }

  .neon-checkbox__borders span:nth-child(3) {
    bottom: 0;
    right: -100%;
    animation: borderFlow3 2s linear infinite;
  }

  .neon-checkbox__borders span:nth-child(4) {
    bottom: -100%;
    left: 0;
    width: 1px;
    height: 40px;
    animation: borderFlow4 2s linear infinite;
  }

  .neon-checkbox__particles span {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--primary);
    border-radius: 50%;
    opacity: 0;
    pointer-events: none;
    top: 50%;
    left: 50%;
    box-shadow: 0 0 6px var(--primary);
  }

  .neon-checkbox__rings {
    position: absolute;
    inset: -20px;
    pointer-events: none;
  }

  .neon-checkbox__rings .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid var(--primary);
    opacity: 0;
    transform: scale(0);
  }

  .neon-checkbox__sparks span {
    position: absolute;
    width: 20px;
    height: 1px;
    background: linear-gradient(90deg, var(--primary), transparent);
    opacity: 0;
  }

  /* Hover Effects */
  .neon-checkbox:hover .neon-checkbox__box {
    border-color: var(--primary);
    transform: scale(1.05);
  }

  /* Checked State */
  .neon-checkbox input:checked ~ .neon-checkbox__frame .neon-checkbox__box {
    border-color: var(--primary);
    background: rgba(0, 255, 170, 0.1);
  }

  .neon-checkbox input:checked ~ .neon-checkbox__frame .neon-checkbox__check {
    stroke-dashoffset: 0;
    transform: scale(1.1);
  }

  .neon-checkbox input:checked ~ .neon-checkbox__frame .neon-checkbox__glow {
    opacity: 0.2;
  }

  .neon-checkbox
    input:checked
    ~ .neon-checkbox__frame
    .neon-checkbox__borders
    span {
    opacity: 1;
  }

  /* Particle Animations */
  .neon-checkbox
    input:checked
    ~ .neon-checkbox__frame
    .neon-checkbox__particles
    span {
    animation: particleExplosion 0.6s ease-out forwards;
  }

  .neon-checkbox
    input:checked
    ~ .neon-checkbox__frame
    .neon-checkbox__rings
    .ring {
    animation: ringPulse 0.6s ease-out forwards;
  }

  .neon-checkbox
    input:checked
    ~ .neon-checkbox__frame
    .neon-checkbox__sparks
    span {
    animation: sparkFlash 0.6s ease-out forwards;
  }

  /* Animations */
  @keyframes borderFlow1 {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(200%);
    }
  }

  @keyframes borderFlow2 {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(200%);
    }
  }

  @keyframes borderFlow3 {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-200%);
    }
  }

  @keyframes borderFlow4 {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-200%);
    }
  }

  @keyframes particleExplosion {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translate(
          calc(-50% + var(--x, 20px)),
          calc(-50% + var(--y, 20px))
        )
        scale(0);
      opacity: 0;
    }
  }

  @keyframes ringPulse {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  @keyframes sparkFlash {
    0% {
      transform: rotate(var(--r, 0deg)) translateX(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: rotate(var(--r, 0deg)) translateX(30px) scale(0);
      opacity: 0;
    }
  }

  /* Particle Positions */
  .neon-checkbox__particles span:nth-child(1) {
    --x: 25px;
    --y: -25px;
  }
  .neon-checkbox__particles span:nth-child(2) {
    --x: -25px;
    --y: -25px;
  }
  .neon-checkbox__particles span:nth-child(3) {
    --x: 25px;
    --y: 25px;
  }
  .neon-checkbox__particles span:nth-child(4) {
    --x: -25px;
    --y: 25px;
  }
  .neon-checkbox__particles span:nth-child(5) {
    --x: 35px;
    --y: 0px;
  }
  .neon-checkbox__particles span:nth-child(6) {
    --x: -35px;
    --y: 0px;
  }
  .neon-checkbox__particles span:nth-child(7) {
    --x: 0px;
    --y: 35px;
  }
  .neon-checkbox__particles span:nth-child(8) {
    --x: 0px;
    --y: -35px;
  }
  .neon-checkbox__particles span:nth-child(9) {
    --x: 20px;
    --y: -30px;
  }
  .neon-checkbox__particles span:nth-child(10) {
    --x: -20px;
    --y: 30px;
  }
  .neon-checkbox__particles span:nth-child(11) {
    --x: 30px;
    --y: 20px;
  }
  .neon-checkbox__particles span:nth-child(12) {
    --x: -30px;
    --y: -20px;
  }

  /* Spark Rotations */
  .neon-checkbox__sparks span:nth-child(1) {
    --r: 0deg;
    top: 50%;
    left: 50%;
  }
  .neon-checkbox__sparks span:nth-child(2) {
    --r: 90deg;
    top: 50%;
    left: 50%;
  }
  .neon-checkbox__sparks span:nth-child(3) {
    --r: 180deg;
    top: 50%;
    left: 50%;
  }
  .neon-checkbox__sparks span:nth-child(4) {
    --r: 270deg;
    top: 50%;
    left: 50%;
  }

  /* Ring Delays */
  .neon-checkbox__rings .ring:nth-child(1) {
    animation-delay: 0s;
  }
  .neon-checkbox__rings .ring:nth-child(2) {
    animation-delay: 0.1s;
  }
  .neon-checkbox__rings .ring:nth-child(3) {
    animation-delay: 0.2s;
  }`;

export default Checkbox;


25:

import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="body">
        <div className="comic-panel">
          <div className="container-items">
            <button className="item-color" style={{-color: '#e11d48'}} aria-color="#e11d48" />
            <button className="item-color" style={{-color: '#f472b6'}} aria-color="#f472b6" />
            <button className="item-color" style={{-color: '#fb923c'}} aria-color="#fb923c" />
            <button className="item-color" style={{-color: '#facc15'}} aria-color="#facc15" />
            <button className="item-color" style={{-color: '#84cc16'}} aria-color="#84cc16" />
            <button className="item-color" style={{-color: '#10b981'}} aria-color="#10b981" />
            <button className="item-color" style={{-color: '#0ea5e9'}} aria-color="#0ea5e9" />
            <button className="item-color" style={{-color: '#3b82f6'}} aria-color="#3b82f6" />
            <button className="item-color" style={{-color: '#8b5cf6'}} aria-color="#8b5cf6" />
            <button className="item-color" style={{-color: '#a78bfa'}} aria-color="#a78bfa" />
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .body {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: #f0e8d8;
    font-family: "Bangers", cursive;
    overflow: hidden;
  }

  .comic-panel {
    background: #ffffff;
    border: 4px solid #000;
    padding: 1.2rem;
    border-radius: 8px;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 1);
  }

  .container-items {
    display: flex;
    transform-style: preserve-3d;
    transform: perspective(1000px);
  }

  .item-color {
    position: relative;
    flex-shrink: 0;
    width: 40px;
    height: 48px;
    border: none;
    outline: none;
    margin: -4px;
    background-color: transparent;
    transition: 300ms ease-out;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .item-color::after {
    position: absolute;
    content: "";
    inset: 0;
    width: 40px;
    height: 40px;
    background-color: var(--color);
    border-radius: 6px;
    border: 3px solid #000;
    box-shadow: 4px 4px 0 0 #000;
    pointer-events: none;
    transition: 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .item-color::before {
    position: absolute;
    content: attr(aria-color);
    left: 50%;
    bottom: 60px;
    font-size: 16px;
    letter-spacing: 1px;
    line-height: 1;
    padding: 6px 10px;
    background-color: #fef3c7;
    color: #000;
    border: 3px solid #000;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transform-origin: bottom center;
    transition:
      all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275),
      opacity 300ms ease-out,
      visibility 300ms ease-out;
    transform: translateX(-50%) scale(0.5) translateY(10px);
    white-space: nowrap;
  }

  .item-color:hover {
    transform: scale(1.5) translateY(-5px);
    z-index: 99999;
  }

  .item-color:hover::before {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) scale(1) translateY(0);
  }

  .item-color:active::after {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 0 #000;
  }

  .item-color:focus::before {
    content: "COPIED!";
    opacity: 1;
    visibility: visible;
    background-color: #a7f3d0;
    transform: translateX(-50%) scale(1) translateY(0);
  }

  .item-color:hover + * {
    transform: scale(1.3) translateY(-3px);
    z-index: 9999;
  }

  .item-color:hover + * + * {
    transform: scale(1.15);
    z-index: 999;
  }

  .item-color:has(+ *:hover) {
    transform: scale(1.3) translateY(-3px);
    z-index: 9999;
  }

  .item-color:has(+ * + *:hover) {
    transform: scale(1.15);
    z-index: 999;
  }`;

export default Card;


26:

import React from 'react';

const Card = () => {
  return (
    <div className="card">
      <div className="relative bg-black w-[300px] sm:w-[350px] group transition-all duration-700 aspect-video flex items-center justify-center">
        <div className="transition-all flex flex-col items-center py-5 justify-start duration-300 group-hover:duration-1000 bg-white w-full h-full absolute group-hover:-translate-y-16">
          <p className="text-xl sm:text-2xl font-semibold text-gray-500 font-serif">
            Thank You
          </p>
          <p className="px-10 text-[10px] sm:text-[12px] text-gray-700">
            It’s so nice that you had the time to view this idea
          </p>
          <p className="font-serif text-[10px] sm:text-[12px text-gray-700">
            Wishing you a fantastic day ahead!
          </p>
          <p className="font-sans text-[10px] text-gray-700 pt-5">SMOOKYDEV</p>
        </div>
        <button className="seal bg-rose-500 text-red-800 w-10 aspect-square rounded-full z-40 text-[10px] flex items-center justify-center font-semibold [clip-path:polygon(50%_0%,_80%_10%,_100%_35%,_100%_70%,_80%_90%,_50%_100%,_20%_90%,_0%_70%,_0%_35%,_20%_10%)] group-hover:opacity-0 transition-all duration-1000 group-hover:scale-0 group-hover:rotate-180 border-4 border-rose-900">
          SMKY
        </button>
        <div className="tp transition-all duration-1000 group-hover:duration-100 bg-neutral-800 absolute group-hover:[clip-path:polygon(50%_0%,_100%_0,_0_0)] w-full h-full [clip-path:polygon(50%_50%,_100%_0,_0_0)]" />
        <div className="lft transition-all duration-700 absolute w-full h-full bg-neutral-900 [clip-path:polygon(50%_50%,_0_0,_0_100%)]" />
        <div className="rgt transition-all duration-700 absolute w-full h-full bg-neutral-800 [clip-path:polygon(50%_50%,_100%_0,_100%_100%)]" />
        <div className="btm transition-all duration-700 absolute w-full h-full bg-neutral-900 [clip-path:polygon(50%_50%,_100%_100%,_0_100%)]" />
      </div>
    </div>
  );
}

export default Card;


27:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__bar" />
        <div className="loader__ball" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    position: relative;
    width: 75px;
    height: 100px;
  }

  .loader__bar {
    position: absolute;
    bottom: 0;
    width: 10px;
    height: 50%;
    background: rgb(0, 0, 0);
    transform-origin: center bottom;
    box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
  }

  .loader__bar:nth-child(1) {
    left: 0px;
    transform: scale(1, 0.2);
    -webkit-animation: barUp1 4s infinite;
    animation: barUp1 4s infinite;
  }

  .loader__bar:nth-child(2) {
    left: 15px;
    transform: scale(1, 0.4);
    -webkit-animation: barUp2 4s infinite;
    animation: barUp2 4s infinite;
  }

  .loader__bar:nth-child(3) {
    left: 30px;
    transform: scale(1, 0.6);
    -webkit-animation: barUp3 4s infinite;
    animation: barUp3 4s infinite;
  }

  .loader__bar:nth-child(4) {
    left: 45px;
    transform: scale(1, 0.8);
    -webkit-animation: barUp4 4s infinite;
    animation: barUp4 4s infinite;
  }

  .loader__bar:nth-child(5) {
    left: 60px;
    transform: scale(1, 1);
    -webkit-animation: barUp5 4s infinite;
    animation: barUp5 4s infinite;
  }

  .loader__ball {
    position: absolute;
    bottom: 10px;
    left: 0;
    width: 10px;
    height: 10px;
    background: rgb(44, 143, 255);
    border-radius: 50%;
    -webkit-animation: ball624 4s infinite;
    animation: ball624 4s infinite;
  }

  @keyframes ball624 {
    0% {
      transform: translate(0, 0);
    }

    5% {
      transform: translate(8px, -14px);
    }

    10% {
      transform: translate(15px, -10px);
    }

    17% {
      transform: translate(23px, -24px);
    }

    20% {
      transform: translate(30px, -20px);
    }

    27% {
      transform: translate(38px, -34px);
    }

    30% {
      transform: translate(45px, -30px);
    }

    37% {
      transform: translate(53px, -44px);
    }

    40% {
      transform: translate(60px, -40px);
    }

    50% {
      transform: translate(60px, 0);
    }

    57% {
      transform: translate(53px, -14px);
    }

    60% {
      transform: translate(45px, -10px);
    }

    67% {
      transform: translate(37px, -24px);
    }

    70% {
      transform: translate(30px, -20px);
    }

    77% {
      transform: translate(22px, -34px);
    }

    80% {
      transform: translate(15px, -30px);
    }

    87% {
      transform: translate(7px, -44px);
    }

    90% {
      transform: translate(0, -40px);
    }

    100% {
      transform: translate(0, 0);
    }
  }

  @-webkit-keyframes barUp1 {
    0% {
      transform: scale(1, 0.2);
    }

    40% {
      transform: scale(1, 0.2);
    }

    50% {
      transform: scale(1, 1);
    }

    90% {
      transform: scale(1, 1);
    }

    100% {
      transform: scale(1, 0.2);
    }
  }

  @keyframes barUp1 {
    0% {
      transform: scale(1, 0.2);
    }

    40% {
      transform: scale(1, 0.2);
    }

    50% {
      transform: scale(1, 1);
    }

    90% {
      transform: scale(1, 1);
    }

    100% {
      transform: scale(1, 0.2);
    }
  }

  @-webkit-keyframes barUp2 {
    0% {
      transform: scale(1, 0.4);
    }

    40% {
      transform: scale(1, 0.4);
    }

    50% {
      transform: scale(1, 0.8);
    }

    90% {
      transform: scale(1, 0.8);
    }

    100% {
      transform: scale(1, 0.4);
    }
  }

  @keyframes barUp2 {
    0% {
      transform: scale(1, 0.4);
    }

    40% {
      transform: scale(1, 0.4);
    }

    50% {
      transform: scale(1, 0.8);
    }

    90% {
      transform: scale(1, 0.8);
    }

    100% {
      transform: scale(1, 0.4);
    }
  }

  @-webkit-keyframes barUp3 {
    0% {
      transform: scale(1, 0.6);
    }

    100% {
      transform: scale(1, 0.6);
    }
  }

  @keyframes barUp3 {
    0% {
      transform: scale(1, 0.6);
    }

    100% {
      transform: scale(1, 0.6);
    }
  }

  @-webkit-keyframes barUp4 {
    0% {
      transform: scale(1, 0.8);
    }

    40% {
      transform: scale(1, 0.8);
    }

    50% {
      transform: scale(1, 0.4);
    }

    90% {
      transform: scale(1, 0.4);
    }

    100% {
      transform: scale(1, 0.8);
    }
  }

  @keyframes barUp4 {
    0% {
      transform: scale(1, 0.8);
    }

    40% {
      transform: scale(1, 0.8);
    }

    50% {
      transform: scale(1, 0.4);
    }

    90% {
      transform: scale(1, 0.4);
    }

    100% {
      transform: scale(1, 0.8);
    }
  }

  @-webkit-keyframes barUp5 {
    0% {
      transform: scale(1, 1);
    }

    40% {
      transform: scale(1, 1);
    }

    50% {
      transform: scale(1, 0.2);
    }

    90% {
      transform: scale(1, 0.2);
    }

    100% {
      transform: scale(1, 1);
    }
  }

  @keyframes barUp5 {
    0% {
      transform: scale(1, 1);
    }

    40% {
      transform: scale(1, 1);
    }

    50% {
      transform: scale(1, 0.2);
    }

    90% {
      transform: scale(1, 0.2);
    }

    100% {
      transform: scale(1, 1);
    }
  }`;

export default Loader;


28:

import React from 'react';

const Card = () => {
  return (
    <div className="relative flex justify-center h-[300px] w-[160px] border border-4 border-black rounded-2xl bg-gray-50" style={{boxShadow: '5px 5px 2.5px 6px rgb(209, 218, 218)'}}>
      <span className="border border-black bg-black w-20 h-2 rounded-br-xl rounded-bl-xl" />
      <span className="absolute -right-2 top-14 border border-4 border-black h-7 rounded-md" />
      <span className="absolute -right-2 bottom-36 border border-4 border-black h-10 rounded-md" />
    </div>
  );
}

export default Card;


29:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="hourglassBackground">
        <div className="hourglassContainer">
          <div className="hourglassCurves" />
          <div className="hourglassCapTop" />
          <div className="hourglassGlassTop" />
          <div className="hourglassSand" />
          <div className="hourglassSandStream" />
          <div className="hourglassCapBottom" />
          <div className="hourglassGlass" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .hourglassBackground {
    position: relative;
    background-color: rgb(71, 60, 60);
    height: 130px;
    width: 130px;
    border-radius: 50%;
    margin: 30px auto;
  }

  .hourglassContainer {
    position: absolute;
    top: 30px;
    left: 40px;
    width: 50px;
    height: 70px;
    -webkit-animation: hourglassRotate 2s ease-in 0s infinite;
    animation: hourglassRotate 2s ease-in 0s infinite;
    transform-style: preserve-3d;
    perspective: 1000px;
  }

  .hourglassContainer div,
  .hourglassContainer div:before,
  .hourglassContainer div:after {
    transform-style: preserve-3d;
  }

  @-webkit-keyframes hourglassRotate {
    0% {
      transform: rotateX(0deg);
    }

    50% {
      transform: rotateX(180deg);
    }

    100% {
      transform: rotateX(180deg);
    }
  }

  @keyframes hourglassRotate {
    0% {
      transform: rotateX(0deg);
    }

    50% {
      transform: rotateX(180deg);
    }

    100% {
      transform: rotateX(180deg);
    }
  }

  .hourglassCapTop {
    top: 0;
  }

  .hourglassCapTop:before {
    top: -25px;
  }

  .hourglassCapTop:after {
    top: -20px;
  }

  .hourglassCapBottom {
    bottom: 0;
  }

  .hourglassCapBottom:before {
    bottom: -25px;
  }

  .hourglassCapBottom:after {
    bottom: -20px;
  }

  .hourglassGlassTop {
    transform: rotateX(90deg);
    position: absolute;
    top: -16px;
    left: 3px;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    background-color: #999999;
  }

  .hourglassGlass {
    perspective: 100px;
    position: absolute;
    top: 32px;
    left: 20px;
    width: 10px;
    height: 6px;
    background-color: #999999;
    opacity: 0.5;
  }

  .hourglassGlass:before,
  .hourglassGlass:after {
    content: '';
    display: block;
    position: absolute;
    background-color: #999999;
    left: -17px;
    width: 44px;
    height: 28px;
  }

  .hourglassGlass:before {
    top: -27px;
    border-radius: 0 0 25px 25px;
  }

  .hourglassGlass:after {
    bottom: -27px;
    border-radius: 25px 25px 0 0;
  }

  .hourglassCurves:before,
  .hourglassCurves:after {
    content: '';
    display: block;
    position: absolute;
    top: 32px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #333;
    animation: hideCurves 2s ease-in 0s infinite;
  }

  .hourglassCurves:before {
    left: 15px;
  }

  .hourglassCurves:after {
    left: 29px;
  }

  @-webkit-keyframes hideCurves {
    0% {
      opacity: 1;
    }

    25% {
      opacity: 0;
    }

    30% {
      opacity: 0;
    }

    40% {
      opacity: 1;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes hideCurves {
    0% {
      opacity: 1;
    }

    25% {
      opacity: 0;
    }

    30% {
      opacity: 0;
    }

    40% {
      opacity: 1;
    }

    100% {
      opacity: 1;
    }
  }

  .hourglassSandStream:before {
    content: '';
    display: block;
    position: absolute;
    left: 24px;
    width: 3px;
    background-color: white;
    -webkit-animation: sandStream1 2s ease-in 0s infinite;
    animation: sandStream1 2s ease-in 0s infinite;
  }

  .hourglassSandStream:after {
    content: '';
    display: block;
    position: absolute;
    top: 36px;
    left: 19px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid #fff;
    animation: sandStream2 2s ease-in 0s infinite;
  }

  @-webkit-keyframes sandStream1 {
    0% {
      height: 0;
      top: 35px;
    }

    50% {
      height: 0;
      top: 45px;
    }

    60% {
      height: 35px;
      top: 8px;
    }

    85% {
      height: 35px;
      top: 8px;
    }

    100% {
      height: 0;
      top: 8px;
    }
  }

  @keyframes sandStream1 {
    0% {
      height: 0;
      top: 35px;
    }

    50% {
      height: 0;
      top: 45px;
    }

    60% {
      height: 35px;
      top: 8px;
    }

    85% {
      height: 35px;
      top: 8px;
    }

    100% {
      height: 0;
      top: 8px;
    }
  }

  @-webkit-keyframes sandStream2 {
    0% {
      opacity: 0;
    }

    50% {
      opacity: 0;
    }

    51% {
      opacity: 1;
    }

    90% {
      opacity: 1;
    }

    91% {
      opacity: 0;
    }

    100% {
      opacity: 0;
    }
  }

  @keyframes sandStream2 {
    0% {
      opacity: 0;
    }

    50% {
      opacity: 0;
    }

    51% {
      opacity: 1;
    }

    90% {
      opacity: 1;
    }

    91% {
      opacity: 0;
    }

    100% {
      opacity: 0;
    }
  }

  .hourglassSand:before,
  .hourglassSand:after {
    content: '';
    display: block;
    position: absolute;
    left: 6px;
    background-color: white;
    perspective: 500px;
  }

  .hourglassSand:before {
    top: 8px;
    width: 39px;
    border-radius: 3px 3px 30px 30px;
    animation: sandFillup 2s ease-in 0s infinite;
  }

  .hourglassSand:after {
    border-radius: 30px 30px 3px 3px;
    animation: sandDeplete 2s ease-in 0s infinite;
  }

  @-webkit-keyframes sandFillup {
    0% {
      opacity: 0;
      height: 0;
    }

    60% {
      opacity: 1;
      height: 0;
    }

    100% {
      opacity: 1;
      height: 17px;
    }
  }

  @keyframes sandFillup {
    0% {
      opacity: 0;
      height: 0;
    }

    60% {
      opacity: 1;
      height: 0;
    }

    100% {
      opacity: 1;
      height: 17px;
    }
  }

  @-webkit-keyframes sandDeplete {
    0% {
      opacity: 0;
      top: 45px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    1% {
      opacity: 1;
      top: 45px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    24% {
      opacity: 1;
      top: 45px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    25% {
      opacity: 1;
      top: 41px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    50% {
      opacity: 1;
      top: 41px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    90% {
      opacity: 1;
      top: 41px;
      height: 0;
      width: 10px;
      left: 20px;
    }
  }

  @keyframes sandDeplete {
    0% {
      opacity: 0;
      top: 45px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    1% {
      opacity: 1;
      top: 45px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    24% {
      opacity: 1;
      top: 45px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    25% {
      opacity: 1;
      top: 41px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    50% {
      opacity: 1;
      top: 41px;
      height: 17px;
      width: 38px;
      left: 6px;
    }

    90% {
      opacity: 1;
      top: 41px;
      height: 0;
      width: 10px;
      left: 20px;
    }
  }`;

export default Loader;


30:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    width: 120px;
    height: 150px;
    background-color: #fff;
    background-repeat: no-repeat;
    background-image: linear-gradient(#ddd 50%, #bbb 51%),
      linear-gradient(#ddd, #ddd), linear-gradient(#ddd, #ddd),
      radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%),
      radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%),
      radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%);
    background-position: 0 20px, 45px 0, 8px 6px, 55px 3px, 75px 3px, 95px 3px;
    background-size: 100% 4px, 1px 23px, 30px 8px, 15px 15px, 15px 15px, 15px 15px;
    position: relative;
    border-radius: 6%;
    animation: shake 3s ease-in-out infinite;
    transform-origin: 60px 180px;
  }

  .loader:before {
    content: "";
    position: absolute;
    left: 5px;
    top: 100%;
    width: 7px;
    height: 5px;
    background: #aaa;
    border-radius: 0 0 4px 4px;
    box-shadow: 102px 0 #aaa;
  }

  .loader:after {
    content: "";
    position: absolute;
    width: 95px;
    height: 95px;
    left: 0;
    right: 0;
    margin: auto;
    bottom: 20px;
    background-color: #bbdefb;
    background-image: linear-gradient( to right, #0004 0%, #0004 49%, #0000 50%, #0000 100% ),
      linear-gradient(135deg, #64b5f6 50%, #607d8b 51%);
    background-size: 30px 100%, 90px 80px;
    border-radius: 50%;
    background-repeat: repeat, no-repeat;
    background-position: 0 0;
    box-sizing: border-box;
    border: 10px solid #DDD;
    box-shadow: 0 0 0 4px #999 inset, 0 0 6px 6px #0004 inset;
    animation: spin 3s ease-in-out infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg)
    }

    50% {
      transform: rotate(360deg)
    }

    75% {
      transform: rotate(750deg)
    }

    100% {
      transform: rotate(1800deg)
    }
  }

  @keyframes shake {
    65%, 80%, 88%, 96% {
      transform: rotate(0.5deg)
    }

    50%, 75%, 84%, 92% {
      transform: rotate(-0.5deg)
    }

    0%, 50%, 100% {
      transform: rotate(0)
    }
  }`;

export default Loader;


31:

import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <div className="scrolldown" style={{-color: 'skyblue'}}>
        <div className="chevrons">
          <div className="chevrondown" />
          <div className="chevrondown" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .scrolldown {
    --color: white;
    --sizeX: 30px;
    --sizeY: 50px;
    position: relative;
    width: var(--sizeX);
    height: var(--sizeY);
    margin-left: var(sizeX / 2);
    border: calc(var(--sizeX) / 10) solid var(--color);
    border-radius: 50px;
    box-sizing: border-box;
    margin-bottom: 16px;
    cursor: pointer;
  }

  .scrolldown::before {
    content: "";
    position: absolute;
    bottom: 30px;
    left: 50%;
    width: 6px;
    height: 6px;
    margin-left: -3px;
    background-color: var(--color);
    border-radius: 100%;
    animation: scrolldown-anim 2s infinite;
    box-sizing: border-box;
    box-shadow: 0px -5px 3px 1px #2a547066;
  }

  @keyframes scrolldown-anim {
    0% {
      opacity: 0;
      height: 6px;
    }

    40% {
      opacity: 1;
      height: 10px;
    }

    80% {
      transform: translate(0, 20px);
      height: 10px;
      opacity: 0;
    }

    100% {
      height: 3px;
      opacity: 0;
    }
  }

  .chevrons {
    padding: 6px 0 0 0;
    margin-left: -3px;
    margin-top: 48px;
    width: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .chevrondown {
    margin-top: -6px;
    position: relative;
    border: solid var(--color);
    border-width: 0 3px 3px 0;
    display: inline-block;
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
  }

  .chevrondown:nth-child(odd) {
    animation: pulse54012 500ms ease infinite alternate;
  }

  .chevrondown:nth-child(even) {
    animation: pulse54012 500ms ease infinite alternate 250ms;
  }

  @keyframes pulse54012 {
    from {
      opacity: 0;
    }

    to {
      opacity: 0.5;
    }
  }`;

export default Button;


