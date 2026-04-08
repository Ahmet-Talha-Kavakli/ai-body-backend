
import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="container">
        <div className="loader" />
        <div className="loader" />
        <div className="loader" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 10;
    width: 160px;
    height: 100px;
    margin-left: -80px;
    margin-top: -50px;
    border-radius: 5px;
    background: #1e3f57;
    animation: dot1_ 3s cubic-bezier(0.55,0.3,0.24,0.99) infinite;
  }

  .loader:nth-child(2) {
    z-index: 11;
    width: 150px;
    height: 90px;
    margin-top: -45px;
    margin-left: -75px;
    border-radius: 3px;
    background: #3c517d;
    animation-name: dot2_;
  }

  .loader:nth-child(3) {
    z-index: 12;
    width: 40px;
    height: 20px;
    margin-top: 50px;
    margin-left: -20px;
    border-radius: 0 0 5px 5px;
    background: #6bb2cd;
    animation-name: dot3_;
  }

  @keyframes dot1_ {
    3%,97% {
      width: 160px;
      height: 100px;
      margin-top: -50px;
      margin-left: -80px;
    }

    30%,36% {
      width: 80px;
      height: 120px;
      margin-top: -60px;
      margin-left: -40px;
    }

    63%,69% {
      width: 40px;
      height: 80px;
      margin-top: -40px;
      margin-left: -20px;
    }
  }

  @keyframes dot2_ {
    3%,97% {
      height: 90px;
      width: 150px;
      margin-left: -75px;
      margin-top: -45px;
    }

    30%,36% {
      width: 70px;
      height: 96px;
      margin-left: -35px;
      margin-top: -48px;
    }

    63%,69% {
      width: 32px;
      height: 60px;
      margin-left: -16px;
      margin-top: -30px;
    }
  }

  @keyframes dot3_ {
    3%,97% {
      height: 20px;
      width: 40px;
      margin-left: -20px;
      margin-top: 50px;
    }

    30%,36% {
      width: 8px;
      height: 8px;
      margin-left: -5px;
      margin-top: 49px;
      border-radius: 8px;
    }

    63%,69% {
      width: 16px;
      height: 4px;
      margin-left: -8px;
      margin-top: -37px;
      border-radius: 10px;
    }
  }`;

export default Loader;



11:

import React from 'react';

const Card = () => {
  return (
    <div className="space-y-2 p-4">
      <div role="alert" className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-900 dark:text-green-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-green-200 dark:hover:bg-green-800 transform hover:scale-105">
        <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-green-600" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <p className="text-xs font-semibold">Success - Everything went smoothly!</p>
      </div>
      <div role="alert" className="bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 dark:border-blue-700 text-blue-900 dark:text-blue-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-blue-200 dark:hover:bg-blue-800 transform hover:scale-105">
        <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <p className="text-xs font-semibold">
          Info - This is some information for you.
        </p>
      </div>
      <div role="alert" className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-yellow-200 dark:hover:bg-yellow-800 transform hover:scale-105">
        <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-yellow-600" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <p className="text-xs font-semibold">
          Warning - Be careful with this next step.
        </p>
      </div>
      <div role="alert" className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100 p-2 rounded-lg flex items-center transition duration-300 ease-in-out hover:bg-red-200 dark:hover:bg-red-800 transform hover:scale-105">
        <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <p className="text-xs font-semibold">Error - Something went wrong.</p>
      </div>
    </div>
  );
}

export default Card;


12:

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="newtons-cradle">
        <div className="newtons-cradle__dot" />
        <div className="newtons-cradle__dot" />
        <div className="newtons-cradle__dot" />
        <div className="newtons-cradle__dot" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .newtons-cradle {
   --uib-size: 50px;
   --uib-speed: 1.2s;
   --uib-color: #474554;
   position: relative;
   display: flex;
   align-items: center;
   justify-content: center;
   width: var(--uib-size);
   height: var(--uib-size);
  }

  .newtons-cradle__dot {
   position: relative;
   display: flex;
   align-items: center;
   height: 100%;
   width: 25%;
   transform-origin: center top;
  }

  .newtons-cradle__dot::after {
   content: '';
   display: block;
   width: 100%;
   height: 25%;
   border-radius: 50%;
   background-color: var(--uib-color);
  }

  .newtons-cradle__dot:first-child {
   animation: swing var(--uib-speed) linear infinite;
  }

  .newtons-cradle__dot:last-child {
   animation: swing2 var(--uib-speed) linear infinite;
  }

  @keyframes swing {
   0% {
    transform: rotate(0deg);
    animation-timing-function: ease-out;
   }

   25% {
    transform: rotate(70deg);
    animation-timing-function: ease-in;
   }

   50% {
    transform: rotate(0deg);
    animation-timing-function: linear;
   }
  }

  @keyframes swing2 {
   0% {
    transform: rotate(0deg);
    animation-timing-function: linear;
   }

   50% {
    transform: rotate(0deg);
    animation-timing-function: ease-out;
   }

   75% {
    transform: rotate(-70deg);
    animation-timing-function: ease-in;
   }
  }`;

export default Loader;


13:

import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <button className="download-button">
        <div className="docs">
          <svg viewBox="0 0 24 24" width={20} height={20} stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1={16} y1={13} x2={8} y2={13} />
            <line x1={16} y1={17} x2={8} y2={17} />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Docs
        </div>
        <div className="download">
          <svg viewBox="0 0 24 24" width={24} height={24} stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1={12} y1={15} x2={12} y2={3} />
          </svg>
        </div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .download-button {
    position: relative;
    border-width: 0;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px;
    z-index: 1;
  }

  .download-button .docs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 40px;
    padding: 0 10px;
    border-radius: 4px;
    z-index: 1;
    background-color: #242a35;
    border: solid 1px #e8e8e82d;
    transition: all 0.5s cubic-bezier(0.77, 0, 0.175, 1);
  }

  .download-button:hover {
    box-shadow:
      rgba(0, 0, 0, 0.25) 0px 54px 55px,
      rgba(0, 0, 0, 0.12) 0px -12px 30px,
      rgba(0, 0, 0, 0.12) 0px 4px 6px,
      rgba(0, 0, 0, 0.17) 0px 12px 13px,
      rgba(0, 0, 0, 0.09) 0px -3px 5px;
  }

  .download {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 90%;
    margin: 0 auto;
    z-index: -1;
    border-radius: 4px;
    transform: translateY(0%);
    background-color: #01e056;
    border: solid 1px #01e0572d;
    transition: all 0.5s cubic-bezier(0.77, 0, 0.175, 1);
  }

  .download-button:hover .download {
    transform: translateY(100%);
  }

  .download svg polyline,
  .download svg line {
    animation: docs 1s infinite;
  }

  @keyframes docs {
    0% {
      transform: translateY(0%);
    }

    50% {
      transform: translateY(-15%);
    }

    100% {
      transform: translateY(0%);
    }
  }`;

export default Button;



