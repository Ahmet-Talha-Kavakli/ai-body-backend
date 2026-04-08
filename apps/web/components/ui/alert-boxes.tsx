'use client'

import React from 'react'

interface AlertProps {
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
}

const alertConfig = {
  success: {
    bg: 'bg-green-100 dark:bg-green-900',
    border: 'border-green-500 dark:border-green-700',
    text: 'text-green-900 dark:text-green-100',
    hover: 'hover:bg-green-200 dark:hover:bg-green-800',
    icon: 'text-green-600',
    default: 'Success - Everything went smoothly!',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    border: 'border-blue-500 dark:border-blue-700',
    text: 'text-blue-900 dark:text-blue-100',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-800',
    icon: 'text-blue-600',
    default: 'Info - This is some information for you.',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    border: 'border-yellow-500 dark:border-yellow-700',
    text: 'text-yellow-900 dark:text-yellow-100',
    hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
    icon: 'text-yellow-600',
    default: 'Warning - Be careful with this next step.',
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900',
    border: 'border-red-500 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    hover: 'hover:bg-red-200 dark:hover:bg-red-800',
    icon: 'text-red-600',
    default: 'Error - Something went wrong.',
  },
}

function Alert({ type, message }: AlertProps) {
  const config = alertConfig[type]

  return (
    <div
      role="alert"
      className={`border-l-4 ${config.bg} ${config.border} ${config.text} p-4 rounded-lg flex items-center transition duration-300 ease-in-out ${config.hover} transform hover:scale-105`}
    >
      <svg
        stroke="currentColor"
        viewBox="0 0 24 24"
        fill="none"
        className={`h-5 w-5 flex-shrink-0 mr-3 ${config.icon}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm font-semibold">{message}</p>
    </div>
  )
}

export function AlertBoxes() {
  return (
    <div className="space-y-3 p-4">
      <Alert type="success" message="Success - Everything went smoothly!" />
      <Alert type="info" message="Info - This is some information for you." />
      <Alert type="warning" message="Warning - Be careful with this next step." />
      <Alert type="error" message="Error - Something went wrong." />
    </div>
  )
}

export { Alert }
