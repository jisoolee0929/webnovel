'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface MonthlySummaryRow {
  year_month: string
  munpia_count: number
  kakao_count: number
  naver_count: number
}

interface MonthlyLineChartProps {
  data: MonthlySummaryRow[]
}

const LABEL_MAP: Record<string, string> = {
  naver_count: '네이버 시리즈',
  kakao_count: '카카오페이지',
  munpia_count: '문피아',
}

export default function MonthlyLineChart({ data }: MonthlyLineChartProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
        월별 구매 편수 추이
      </h2>
      <p className="mb-4 text-xs text-gray-400">플랫폼별 월간 구매 편수</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="year_month"
              interval={5}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
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
              formatter={(value, name) => [
                `${Number(value).toLocaleString()}편`,
                LABEL_MAP[String(name)] ?? String(name),
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {LABEL_MAP[value] ?? value}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="naver_count"
              stroke="#10B981"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="kakao_count"
              stroke="#F59E0B"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="munpia_count"
              stroke="#3B82F6"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
