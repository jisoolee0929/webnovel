'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PLATFORM_COLORS: Record<string, string> = {
  '네이버 시리즈': '#3B82F6',
  '카카오페이지': '#F59E0B',
  '문피아': '#10B981',
}

interface PlatformDonutProps {
  data: { platform: string; count: number }[]
}

export default function PlatformDonut({ data }: PlatformDonutProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
        플랫폼별 구매 비중
      </h2>
      <p className="mb-4 text-xs text-gray-400">구매 건수 기준</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="count"
              nameKey="platform"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.platform}
                  fill={PLATFORM_COLORS[entry.platform] ?? '#6B7280'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const n = Number(value)
                return [`${n.toLocaleString()}건 (${total > 0 ? ((n / total) * 100).toFixed(1) : 0}%)`, '구매 건수']
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
