'use client'

import { useState } from 'react'
import WorkDetailModal from '@/components/WorkDetailModal'

const PLATFORM_BADGE: Record<string, string> = {
  '네이버 시리즈': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  '카카오페이지': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '문피아': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

interface Work {
  platform: string
  title: string
  purchase_count: number
}

interface TopWorksTableProps {
  works: Work[]
}

export default function TopWorksTable({ works }: TopWorksTableProps) {
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)

  return (
    <>
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top 10 작품</h2>
          <p className="mt-0.5 text-xs text-gray-400">결제 기준 상위 10개 작품</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  순위
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  작품명
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  플랫폼
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                  구매 편수
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {works.map((work, idx) => (
                <tr
                  key={`${work.platform}-${work.title}`}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="px-5 py-3 font-medium text-gray-400 dark:text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedWork(work)}
                      className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
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
                  <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {work.purchase_count.toLocaleString()}편
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWork && (
        <WorkDetailModal
          title={selectedWork.title}
          platform={selectedWork.platform}
          isOpen={true}
          onClose={() => setSelectedWork(null)}
        />
      )}
    </>
  )
}
