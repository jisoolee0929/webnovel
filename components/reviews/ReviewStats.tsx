'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import StarRating from './StarRating'
import type { Review } from '@/types/review'

interface ReviewStatsProps {
  reviews: Review[]
}

export default function ReviewStats({ reviews }: ReviewStatsProps) {
  const count = reviews.length
  const validRatings = reviews.filter((r) => r.rating !== null)
  const avgRating =
    validRatings.length > 0
      ? validRatings.reduce((sum, r) => sum + (r.rating ?? 0), 0) / validRatings.length
      : 0

  const distribution = Array.from({ length: 10 }, (_, i) => {
    const rating = (i + 1) * 0.5
    return {
      label: rating.toFixed(1),
      count: reviews.filter((r) => r.rating === rating).length,
    }
  })

  const maxCount = Math.max(...distribution.map((d) => d.count), 1)

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-6">
        {/* 총 리뷰 수 */}
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{count}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">총 리뷰</p>
        </div>

        {/* 구분선 */}
        {count > 0 && (
          <div className="h-10 w-px bg-gray-100 dark:bg-gray-700" />
        )}

        {/* 평균 평점 */}
        {count > 0 && (
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {avgRating.toFixed(1)}
            </p>
            <div className="mt-1">
              <StarRating rating={avgRating} size="sm" showValue={false} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">평균 평점</p>
          </div>
        )}

        {/* 평점 분포 차트 */}
        {count >= 5 && (
          <div className="flex-1 min-w-[200px]">
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">평점 분포</p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                    interval={1}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [`${value}개`, '']}
                    labelFormatter={(label) => `★${label}`}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {distribution.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={entry.count === maxCount && entry.count > 0 ? '#F59E0B' : '#FDE68A'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
