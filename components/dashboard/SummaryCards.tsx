import { BookOpen, Library, Trophy, Calendar } from 'lucide-react'

const PLATFORM_ICON_COLORS: Record<string, string> = {
  '네이버 시리즈': 'text-emerald-500',
  '카카오페이지': 'text-amber-500',
  '문피아': 'text-blue-500',
}

interface SummaryCardsProps {
  totalPurchaseCount: number
  worksCount: number
  topPlatform: string
  lifeDuration: string
}

export default function SummaryCards({
  totalPurchaseCount,
  worksCount,
  topPlatform,
  lifeDuration,
}: SummaryCardsProps) {
  const cards = [
    {
      label: '총 구매 편수',
      value: `${totalPurchaseCount.toLocaleString()}편`,
      icon: BookOpen,
      iconColor: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: '읽은 작품 수',
      value: `${worksCount.toLocaleString()}작품`,
      icon: Library,
      iconColor: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: '가장 많이 쓴 플랫폼',
      value: topPlatform,
      icon: Trophy,
      iconColor: PLATFORM_ICON_COLORS[topPlatform] ?? 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: '웹소설 생활 기간',
      value: lifeDuration,
      icon: Calendar,
      iconColor: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className={`mb-3 inline-flex rounded-lg p-2 ${card.bg}`}>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}
