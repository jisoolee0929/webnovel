'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import StarRating from '@/components/reviews/StarRating'

const PLATFORM_BADGE: Record<string, string> = {
  '네이버 시리즈': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  '카카오페이지': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '문피아': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '기타': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

const PLATFORM_COLOR: Record<string, string> = {
  '네이버 시리즈': '#10B981',
  '카카오페이지': '#F59E0B',
  '문피아': '#3B82F6',
}

type WorkInfo = {
  purchase_count: number
  author: string
  genre: string
  rating: number | null
}

type ReviewInfo = {
  id: number
  rating: number | null
  short_review: string | null
  read_start_date: string | null
  read_end_date: string | null
}

type MonthlyCount = { year_month: string; count: number }

interface WorkDetailModalProps {
  title: string
  platform: string
  isOpen: boolean
  onClose: () => void
  onOpenReviewModal?: (title: string, platform: string) => void
}

export default function WorkDetailModal({
  title,
  platform,
  isOpen,
  onClose,
  onOpenReviewModal,
}: WorkDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [work, setWork] = useState<WorkInfo | null>(null)
  const [monthly, setMonthly] = useState<MonthlyCount[]>([])
  const [review, setReview] = useState<ReviewInfo | null | undefined>(undefined)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setLoading(true)
    setWork(null)
    setMonthly([])
    setReview(undefined)

    const load = async () => {
      const [workRes, txRes, reviewRes] = await Promise.all([
        supabase
          .from('works_public')
          .select('purchase_count, author, genre, rating')
          .eq('title', title)
          .eq('platform', platform)
          .maybeSingle(),
        supabase
          .from('transactions_public')
          .select('year_month')
          .eq('title', title)
          .eq('platform', platform),
        supabase
          .from('reviews')
          .select('id, rating, short_review, read_start_date, read_end_date')
          .eq('title', title)
          .eq('platform', platform)
          .limit(1),
      ])

      if (cancelled) return

      setWork(workRes.data ?? null)

      // transactions_public의 year_month를 JS에서 집계
      const counts: Record<string, number> = {}
      for (const tx of txRes.data ?? []) {
        counts[tx.year_month] = (counts[tx.year_month] ?? 0) + 1
      }
      setMonthly(
        Object.entries(counts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year_month, count]) => ({ year_month, count })),
      )

      // null = 리뷰 없음, ReviewInfo = 리뷰 있음
      setReview(reviewRes.data?.[0] ?? null)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [isOpen, title, platform])

  if (!isOpen) return null

  const barColor = PLATFORM_COLOR[platform] ?? '#6B7280'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">

        {/* 헤더 */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE[platform] ?? PLATFORM_BADGE['기타']}`}
            >
              {platform}
            </span>
            <h2 className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white leading-snug">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : (
            <div className="space-y-5">

              {/* 구매 편수 */}
              {work && (
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${barColor}18` }}
                  >
                    <BookOpen className="h-5 w-5" style={{ color: barColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">총 구매 편수</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {work.purchase_count.toLocaleString()}편
                    </p>
                  </div>
                </div>
              )}

              {/* 작가 · 장르 · 플랫폼 별점 */}
              {work && (work.author || work.genre || work.rating !== null) && (
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  {work.author && <span>✍️ {work.author}</span>}
                  {work.genre && <span>📚 {work.genre}</span>}
                  {work.rating !== null && work.rating !== undefined && (
                    <span>⭐ {work.rating} / 10</span>
                  )}
                </div>
              )}

              {/* 월별 구매 편수 미니 바 차트 */}
              {monthly.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    월별 구매 추이
                  </p>
                  <div className="h-28 rounded-lg bg-gray-50 p-2 dark:bg-gray-900/40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthly} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                        <XAxis
                          dataKey="year_month"
                          tick={{ fontSize: 9, fill: '#9CA3AF' }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis hide />
                        <Tooltip
                          formatter={(value) => [`${value}편`, '구매']}
                          labelFormatter={(label) => String(label)}
                          contentStyle={{
                            fontSize: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          }}
                        />
                        <Bar dataKey="count" fill={barColor} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 내 리뷰 섹션 */}
              <div className="border-t border-gray-100 pt-5 dark:border-gray-700">
                <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  내 리뷰
                </p>

                {review ? (
                  <div className="space-y-2.5 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                    {review.rating !== null && (
                      <StarRating rating={review.rating} size="sm" />
                    )}
                    {review.short_review && (
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {review.short_review}
                      </p>
                    )}
                    {(review.read_start_date || review.read_end_date) && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {[
                          review.read_start_date?.replace(/-/g, '.'),
                          review.read_end_date?.replace(/-/g, '.'),
                        ]
                          .filter(Boolean)
                          .join(' ~ ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-5 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      아직 리뷰가 없어요
                    </p>
                    {onOpenReviewModal && (
                      <button
                        onClick={() => {
                          onClose()
                          onOpenReviewModal(title, platform)
                        }}
                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                      >
                        리뷰 작성하기
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
