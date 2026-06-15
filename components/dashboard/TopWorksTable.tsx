'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import WorkDetailModal from '@/components/WorkDetailModal'
import ReviewModal from '@/components/reviews/ReviewModal'
import { supabase } from '@/lib/supabase'
import type { ReviewFormData } from '@/types/review'

const PLATFORM_BADGE: Record<string, string> = {
  '네이버 시리즈': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  '카카오페이지': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '문피아': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

// 순위 메달 색상 (1~3위)
const RANK_STYLE: Record<number, string> = {
  1: 'font-bold text-amber-500',
  2: 'font-bold text-gray-400',
  3: 'font-bold text-amber-700',
}

const DEFAULT_VISIBLE = 10

interface Work {
  platform: string
  title: string
  author: string
  genre: string
  purchase_count: number
}

interface TopWorksTableProps {
  works: Work[]
}

export default function TopWorksTable({ works }: TopWorksTableProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [reviewPrefill, setReviewPrefill] = useState<{ title: string; platform: string } | null>(null)

  const visible = expanded ? works : works.slice(0, DEFAULT_VISIBLE)
  const hiddenCount = works.length - DEFAULT_VISIBLE

  const handleSaveReview = async (data: ReviewFormData) => {
    const { error } = await supabase.from('reviews').insert({
      platform: data.platform,
      title: data.title,
      read_start_date: data.read_start_date || null,
      read_end_date: data.read_end_date || null,
      rating: data.rating || null,
      short_review: data.short_review || null,
    })
    if (error) throw new Error(error.message)
    setReviewPrefill(null)
  }

  return (
    <>
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">작품 랭킹</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            결제 기준 전체 {works.length.toLocaleString()}개 작품
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="w-14 px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  순위
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  작품명
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  플랫폼
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  장르
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  작가
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                  구매 편수
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {visible.map((work, idx) => {
                const rank = idx + 1
                return (
                  <tr
                    key={`${work.platform}-${work.title}`}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    <td className={`px-5 py-3 tabular-nums ${RANK_STYLE[rank] ?? 'text-gray-400 dark:text-gray-500'}`}>
                      {rank <= 3 ? (
                        <span className="text-base">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        rank
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedWork(work)}
                        className="text-left font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {work.title}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE[work.platform] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {work.platform}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {work.genre || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {work.author || '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {work.purchase_count.toLocaleString()}편
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 더보기 / 접기 버튼 */}
        {hiddenCount > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/40 dark:hover:text-gray-200"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {hiddenCount.toLocaleString()}개 더보기
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 작품 상세 모달 */}
      {selectedWork && (
        <WorkDetailModal
          title={selectedWork.title}
          platform={selectedWork.platform}
          isOpen={true}
          onClose={() => setSelectedWork(null)}
          onOpenReviewModal={(title, platform) => {
            setSelectedWork(null)
            setReviewPrefill({ title, platform })
          }}
        />
      )}

      {/* 리뷰 작성 모달 */}
      {reviewPrefill && (
        <ReviewModal
          review={null}
          initialTitle={reviewPrefill.title}
          initialPlatform={reviewPrefill.platform}
          onSave={handleSaveReview}
          onClose={() => setReviewPrefill(null)}
        />
      )}
    </>
  )
}
