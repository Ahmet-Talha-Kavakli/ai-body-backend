'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Review {
  id: string
  author: string
  role: string
  company: string
  content: string
  image: string
  thumbnail: string
  rating: number
}

interface TestimonialSliderProps {
  reviews: Review[]
  className?: string
}

const TestimonialSlider = ({
  reviews,
  className = '',
}: TestimonialSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      y: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const textVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex + newDirection + reviews.length) % reviews.length
    )
  }

  const currentReview = reviews[currentIndex]

  return (
    <div className={`w-full bg-background text-foreground ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {/* Left Column - Meta Information */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-8">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  {currentReview.author}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentReview.role} at {currentReview.company}
                </p>
              </div>

              {/* Rating */}
              <div className="mb-8 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${
                      i < currentReview.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-muted text-muted'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="hidden space-y-2 md:block">
              {reviews.map((review, index) => (
                <button
                  key={review.id}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1)
                    setCurrentIndex(index)
                  }}
                  className={`h-12 w-12 overflow-hidden rounded border-2 transition-colors ${
                    index === currentIndex
                      ? 'border-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img
                    src={review.thumbnail}
                    alt={review.author}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Center Column - Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.img
                key={currentIndex}
                src={currentReview.image}
                alt={currentReview.author}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  y: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>

          {/* Right Column - Content and Controls */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Text Content */}
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={currentIndex}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <p className="mb-6 text-lg leading-relaxed text-foreground">
                    "{currentReview.content}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Pagination */}
              <div className="text-sm text-muted-foreground">
                {String(currentIndex + 1).padStart(2, '0')}/
                {String(reviews.length).padStart(2, '0')}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => paginate(-1)}
                  aria-label="Previous review"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => paginate(1)}
                  aria-label="Next review"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo Component
const TestimonialSliderDemo = () => {
  const reviews: Review[] = [
    {
      id: '1',
      author: 'Sarah Chen',
      role: 'Product Manager',
      company: 'TechVenture',
      content:
        'This product has completely transformed how our team collaborates. The intuitive interface combined with powerful features makes it indispensable.',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60',
      thumbnail:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
      rating: 5,
    },
    {
      id: '2',
      author: 'Marcus Johnson',
      role: 'CEO',
      company: 'Innovation Labs',
      content:
        'The ROI we\'ve seen is extraordinary. Within the first month, our productivity increased by 40% and our team loved the seamless integration.',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
      thumbnail:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
      rating: 5,
    },
    {
      id: '3',
      author: 'Emma Rodriguez',
      role: 'Design Lead',
      company: 'Creative Studios',
      content:
        'As a designer, I appreciate every detail. The attention to UX is remarkable, and the customization options are exactly what we needed.',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&auto=format&fit=crop&q=60',
      thumbnail:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60',
      rating: 5,
    },
    {
      id: '4',
      author: 'David Kim',
      role: 'CTO',
      company: 'DataFlow Systems',
      content:
        'The technical implementation is pristine. Clean APIs, excellent documentation, and the support team responds within hours. Couldn\'t ask for better.',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60',
      thumbnail:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
      rating: 5,
    },
    {
      id: '5',
      author: 'Lisa Wang',
      role: 'Operations Manager',
      company: 'Global Ventures',
      content:
        'Reliability and scalability were our concerns, but this solution handles everything effortlessly. We\'ve scaled 10x and it hasn\'t broken a sweat.',
      image:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60',
      thumbnail:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60',
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <TestimonialSlider reviews={reviews} />
    </div>
  )
}

export { TestimonialSlider, TestimonialSliderDemo }
