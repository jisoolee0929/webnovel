'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, BookOpen } from 'lucide-react'

interface NavbarProps {
  onOpenChat: () => void
}

export default function Navbar({ onOpenChat }: NavbarProps) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <span>웹소설 트래커</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              대시보드
            </Link>
            <Link
              href="/reviews"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/reviews'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              리뷰
            </Link>
          </div>
        </div>
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          aria-label="AI 챗봇 열기"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">AI 챗봇</span>
        </button>
      </div>
    </nav>
  )
}
