'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import StarInput from './StarInput'
import type { Review, ReviewFormData } from '@/types/review'

const PLATFORMS = ['네이버 시리즈', '카카오페이지', '문피아', '기타']
const MAX_CHARS = 500

const EMPTY_FORM: ReviewFormData = {
  platform: '네이버 시리즈',
  title: '',
  read_start_date: '',
  read_end_date: '',
  rating: 0,
  short_review: '',
}

interface ReviewModalProps {
  review: Review | null
  initialTitle?: string
  initialPlatform?: string
  onSave: (data: ReviewFormData) => Promise<void>
  onClose: () => void
}

export default function ReviewModal({
  review,
  initialTitle,
  initialPlatform,
  onSave,
  onClose,
}: ReviewModalProps) {
  const [form, setForm] = useState<ReviewFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormData, string>>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (review) {
      setForm({
        platform: review.platform,
        title: review.title,
        read_start_date: review.read_start_date ?? '',
        read_end_date: review.read_end_date ?? '',
        rating: review.rating ?? 0,
        short_review: review.short_review ?? '',
      })
    } else {
      setForm({
        ...EMPTY_FORM,
        title: initialTitle ?? '',
        platform: initialPlatform ?? '네이버 시리즈',
      })
    }
    setErrors({})
  }, [review, initialTitle, initialPlatform])

  const set = <K extends keyof ReviewFormData>(key: K, value: ReviewFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!form.title.trim()) newErrors.title = '작품명을 입력해주세요'
    if (!form.platform) newErrors.platform = '플랫폼을 선택해주세요'
    if (!form.rating) newErrors.rating = '평점을 선택해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(form)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-800">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {review ? '리뷰 수정' : '리뷰 작성'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* 작품명 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              작품명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="작품명을 입력하세요"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* 플랫폼 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              플랫폼 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.platform}
              onChange={(e) => set('platform', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 읽은 기간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                읽기 시작 날짜
              </label>
              <input
                type="date"
                value={form.read_start_date}
                onChange={(e) => set('read_start_date', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                다 읽은 날짜
              </label>
              <input
                type="date"
                value={form.read_end_date}
                onChange={(e) => set('read_end_date', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* 평점 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              평점 <span className="text-red-500">*</span>
            </label>
            <StarInput value={form.rating} onChange={(v) => set('rating', v)} />
            {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
          </div>

          {/* 리뷰 본문 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              짧은 리뷰
            </label>
            <textarea
              value={form.short_review}
              onChange={(e) => set('short_review', e.target.value.slice(0, MAX_CHARS))}
              rows={4}
              placeholder="작품에 대한 짧은 감상을 남겨보세요"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {form.short_review.length} / {MAX_CHARS}
            </p>
          </div>

          {/* 저장 오류 */}
          {saveError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {saveError.includes('schema cache') || saveError.includes('does not exist')
                ? 'DB가 설정되지 않았습니다. Supabase SQL Editor에서 schema.sql을 먼저 실행해주세요.'
                : `저장 실패: ${saveError}`}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
