'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface DayOfWeekBarProps {
  data: { day: string; count: number }[]
}

export default function DayOfWeekBar({ data }: DayOfWeekBarProps) {
  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
        요일별 구매 편수
      </h2>
      <p className="mb-4 text-xs text-gray-400">요일별 구매 건수</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 13, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()}건`, '구매 건수']}
              cursor={{ fill: 'rgba(59,130,246,0.08)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={entry.count === maxCount ? '#3B82F6' : '#93C5FD'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
