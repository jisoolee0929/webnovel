'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import StarRating from './StarRating'
import type { Review } from '@/types/review'

const PLATFORM_BADGE: Record<string, string> = {
  '네이버 시리즈': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '카카오페이지': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '문피아': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  '기타': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

function formatDate(d: string | null) {
  return d ? d.replace(/-/g, '.') : ''
}

function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return null
  if (start && end) return `${formatDate(start)} ~ ${formatDate(end)}`
  if (start) return `${formatDate(start)} ~`
  return `~ ${formatDate(end)}`
}

interface ReviewCardProps {
  review: Review
  onEdit: (review: Review) => void
  onDelete: (id: number) => Promise<void>
  onTitleClick: (title: string, platform: string) => void
}

export default function ReviewCard({ review, onEdit, onDelete, onTitleClick }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isLong = (review.short_review?.length ?? 0) > 120
  const period = formatPeriod(review.read_start_date, review.read_end_date)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(review.id)
    setDeleting(false)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      {/* 헤더: 작품명 + 배지 + 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <button
            onClick={() => onTitleClick(review.title, review.platform)}
            className="truncate text-left font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
          >
            {review.title}
          </button>
          <span
            className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE[review.platform] ?? PLATFORM_BADGE['기타']}`}
          >
            {review.platform}
          </span>
        </div>

        {/* 수정/삭제 버튼 */}
        <div className="flex shrink-0 items-center gap-1">
          {!confirmDelete ? (
            <>
              <button
                onClick={() => onEdit(review)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">삭제할까요?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                확인
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 별점 */}
      {review.rating !== null && (
        <StarRating rating={review.rating} size="sm" />
      )}

      {/* 읽은 기간 */}
      {period && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{period}</p>
      )}

      {/* 리뷰 본문 */}
      {review.short_review && (
        <div>
          <p
            className={`text-sm leading-relaxed text-gray-600 dark:text-gray-300 ${
              !expanded && isLong ? 'line-clamp-2' : ''
            }`}
          >
            {review.short_review}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-medium text-blue-500 hover:text-blue-700"
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
