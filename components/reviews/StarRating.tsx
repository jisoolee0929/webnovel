import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md'
  showValue?: boolean
}

export default function StarRating({ rating, size = 'md', showValue = true }: StarRatingProps) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const diff = rating - i
        if (diff >= 1) {
          return <Star key={i} className={`${cls} fill-amber-400 text-amber-400`} />
        }
        if (diff >= 0.5) {
          return (
            <span key={i} className="relative inline-flex shrink-0">
              <Star className={`${cls} text-gray-200 dark:text-gray-600`} />
              <span className="absolute inset-0 w-1/2 overflow-hidden">
                <Star className={`${cls} fill-amber-400 text-amber-400`} />
              </span>
            </span>
          )
        }
        return <Star key={i} className={`${cls} text-gray-200 dark:text-gray-600`} />
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
