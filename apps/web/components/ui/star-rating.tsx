'use client'

import React, { useState } from 'react'

export function StarRating() {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)

  const stars = [1, 2, 3, 4, 5]

  const StarIcon = ({ filled, isHovered }: { filled: boolean; isHovered: boolean }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={`w-8 h-8 transition-all duration-500 ${
        filled
          ? 'fill-yellow-400 stroke-yellow-400 stroke-0'
          : isHovered
            ? 'fill-transparent stroke-yellow-400'
            : 'fill-transparent stroke-gray-500'
      }`}
      strokeWidth="1"
      strokeLinejoin="bevel"
      style={{
        animation: filled ? 'yippee 0.75s ease-out backwards' : 'idle 4s linear infinite',
        strokeDasharray: filled ? 0 : 12,
        strokeDashoffset: filled ? 0 : 24,
      }}
    >
      <path pathLength={360} d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
    </svg>
  )

  return (
    <div className="flex flex-row-reverse gap-1 cursor-pointer" style={{ '--stroke': '#666', '--fill': '#ffc73a' } as any}>
      {stars.map((star) => (
        <label
          key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => setRating(star)}
          className="cursor-pointer"
        >
          <input
            type="radio"
            name="star-rating"
            value={star}
            checked={rating === star}
            onChange={() => setRating(star)}
            className="hidden"
          />
          <StarIcon filled={rating >= star} isHovered={hovered >= star} />
        </label>
      ))}

      <style>{`
        @keyframes idle {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes yippee {
          0% {
            transform: scale(1);
            fill-opacity: 0;
            stroke-opacity: 1;
            stroke-dasharray: 10;
            stroke-width: 1px;
          }
          30% {
            transform: scale(0);
            fill-opacity: 0;
            stroke-opacity: 1;
            stroke-dasharray: 10;
            stroke-width: 1px;
          }
          30.1% {
            stroke-dasharray: 0;
            stroke-width: 8px;
          }
          60% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
