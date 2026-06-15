'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const GENRE_COLORS = [
  '#6366F1', // 판타지
  '#10B981', // 무협
  '#F59E0B', // 로맨스
  '#EF4444', // 현대
  '#8B5CF6', // 게임
  '#06B6D4', // 회귀
  '#F97316', // 헌터
  '#6B7280', // 기타
]

interface GenreDonutProps {
  data: { genre: string; count: number }[]
}

export default function GenreDonut({ data }: GenreDonutProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
        장르별 구매 비중
      </h2>
      <p className="mb-4 text-xs text-gray-400">구매 편수 기준 (복수 장르 각각 집계)</p>
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
              nameKey="genre"
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.genre}
                  fill={GENRE_COLORS[idx % GENRE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const n = Number(value)
                return [
                  `${n.toLocaleString()}편 (${total > 0 ? ((n / total) * 100).toFixed(1) : 0}%)`,
                  '구매 편수',
                ]
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
