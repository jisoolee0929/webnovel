'use client'

import { X } from 'lucide-react'

const PLATFORM_BADGE: Record<string, string> = {
  '네이버 시리즈': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '카카오페이지': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '문피아': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

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
}: WorkDetailModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_BADGE[platform] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {platform}
            </span>
            <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500">
          작품 상세 정보는 4단계에서 구현됩니다.
        </p>
      </div>
    </div>
  )
}
