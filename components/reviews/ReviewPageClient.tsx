'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ReviewStats from './ReviewStats'
import ReviewCard from './ReviewCard'
import ReviewModal from './ReviewModal'
import WorkDetailModal from '@/components/WorkDetailModal'
import type { Review, ReviewFormData } from '@/types/review'

const PLATFORMS = ['전체', '네이버 시리즈', '카카오페이지', '문피아']
const PLATFORM_ACTIVE: Record<string, string> = {
  '전체': 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
  '네이버 시리즈': 'bg-blue-500 text-white',
  '카카오페이지': 'bg-amber-500 text-white',
  '문피아': 'bg-emerald-500 text-white',
}

interface ReviewPageClientProps {
  initialReviews: Review[]
}

export default function ReviewPageClient({ initialReviews }: ReviewPageClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('전체')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  // 모달 상태
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [prefill, setPrefill] = useState<{ title: string; platform: string } | null>(null)

  // 작품 상세 모달 상태
  const [selectedWork, setSelectedWork] = useState<{ title: string; platform: string } | null>(null)

  // 클라이언트 사이드 필터링
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
      if (platformFilter !== '전체' && r.platform !== platformFilter) return false
      if (ratingFilter && (r.rating ?? 0) < ratingFilter) return false
      return true
    })
  }, [reviews, search, platformFilter, ratingFilter])

  const refreshReviews = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('updated_at', { ascending: false })
    setReviews(data ?? [])
  }, [])

  const handleSave = async (data: ReviewFormData) => {
    if (editingReview) {
      await supabase.from('reviews').update({
        platform: data.platform,
        title: data.title,
        read_start_date: data.read_start_date || null,
        read_end_date: data.read_end_date || null,
        rating: data.rating || null,
        short_review: data.short_review || null,
      }).eq('id', editingReview.id)
    } else {
      await supabase.from('reviews').insert({
        platform: data.platform,
        title: data.title,
        read_start_date: data.read_start_date || null,
        read_end_date: data.read_end_date || null,
        rating: data.rating || null,
        short_review: data.short_review || null,
      })
    }
    await refreshReviews()
    setIsReviewModalOpen(false)
    setEditingReview(null)
    setPrefill(null)
  }

  const handleDelete = async (id: number) => {
    await supabase.from('reviews').delete().eq('id', id)
    await refreshReviews()
  }

  const openCreate = (title = '', platform = '') => {
    setEditingReview(null)
    setPrefill(title ? { title, platform } : null)
    setIsReviewModalOpen(true)
  }

  const openEdit = (review: Review) => {
    setEditingReview(review)
    setPrefill(null)
    setIsReviewModalOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* 상단 통계 */}
      <ReviewStats reviews={reviews} />

      {/* 필터 & 검색 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 작품명 검색 */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="작품명 검색..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          {/* 플랫폼 필터 */}
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                platformFilter === p
                  ? PLATFORM_ACTIVE[p]
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {p}
            </button>
          ))}

          {/* 평점 필터 구분선 */}
          <div className="w-px bg-gray-200 dark:bg-gray-600" />

          {/* 평점 필터 */}
          {[null, 3, 4].map((r) => (
            <button
              key={r ?? 'all'}
              onClick={() => setRatingFilter(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                ratingFilter === r
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {r === null ? '전체' : `⭐${r}점 이상`}
            </button>
          ))}
        </div>
      </div>

      {/* 리뷰 카드 목록 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={openEdit}
              onDelete={handleDelete}
              onTitleClick={(title, platform) => setSelectedWork({ title, platform })}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            {reviews.length === 0 ? '아직 작성한 리뷰가 없어요' : '검색 결과가 없어요'}
          </p>
          {reviews.length === 0 && (
            <button
              onClick={() => openCreate()}
              className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              첫 리뷰 작성하기
            </button>
          )}
        </div>
      )}

      {/* 우하단 플로팅 버튼 */}
      <button
        onClick={() => openCreate()}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:bg-blue-600 hover:shadow-xl"
        aria-label="리뷰 작성"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 리뷰 작성/수정 모달 */}
      {isReviewModalOpen && (
        <ReviewModal
          review={editingReview}
          initialTitle={prefill?.title}
          initialPlatform={prefill?.platform}
          onSave={handleSave}
          onClose={() => {
            setIsReviewModalOpen(false)
            setEditingReview(null)
            setPrefill(null)
          }}
        />
      )}

      {/* 작품 상세 모달 */}
      {selectedWork && (
        <WorkDetailModal
          title={selectedWork.title}
          platform={selectedWork.platform}
          isOpen={true}
          onClose={() => setSelectedWork(null)}
          onOpenReviewModal={(title, platform) => {
            setSelectedWork(null)
            openCreate(title, platform)
          }}
        />
      )}
    </div>
  )
}
