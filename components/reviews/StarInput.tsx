'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarInputProps {
  value: number
  onChange: (rating: number) => void
}

export default function StarInput({ value, onChange }: StarInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const display = hoverValue ?? value

  const getRating = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return e.clientX - rect.left < rect.width / 2 ? index + 0.5 : index + 1
  }

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverValue(null)}>
      {Array.from({ length: 5 }, (_, i) => {
        const diff = display - i
        const isFull = diff >= 1
        const isHalf = diff >= 0.5 && diff < 1

        return (
          <button
            key={i}
            type="button"
            className="relative h-7 w-7 focus:outline-none"
            onMouseMove={(e) => setHoverValue(getRating(e, i))}
            onClick={(e) => onChange(getRating(e, i))}
          >
            <Star className="h-7 w-7 text-gray-200 dark:text-gray-600" />
            {(isFull || isHalf) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: isFull ? '100%' : '50%' }}
              >
                <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
              </span>
            )}
          </button>
        )
      })}
      <span className="ml-1 min-w-[2rem] text-sm font-medium text-gray-600 dark:text-gray-400">
        {display > 0 ? `${display.toFixed(1)}점` : ''}
      </span>
    </div>
  )
}
