export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import SummaryCards from '@/components/dashboard/SummaryCards'
import PlatformDonut from '@/components/dashboard/PlatformDonut'
import MonthlyLineChart from '@/components/dashboard/MonthlyLineChart'
import TopWorksTable from '@/components/dashboard/TopWorksTable'
import DayOfWeekBar from '@/components/dashboard/DayOfWeekBar'

const PLATFORMS = ['네이버 시리즈', '카카오페이지', '문피아'] as const
const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

export default async function DashboardPage() {
  try {
    const [
      worksResult,
      worksCountResult,
      firstTxResult,
      monthlySummaryResult,
      topWorksResult,
      platformResults,
      dowResults,
    ] = await Promise.all([
      supabase.from('works').select('platform, purchase_count'),
      supabase.from('works').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('date').order('date', { ascending: true }).limit(1),
      supabase
        .from('monthly_summary')
        .select('year_month, munpia_count, kakao_count, naver_count')
        .order('year_month', { ascending: true }),
      supabase
        .from('works')
        .select('platform, title, purchase_count, total_amount_krw')
        .order('total_amount_krw', { ascending: false })
        .limit(10),
      Promise.all(
        PLATFORMS.map((p) =>
          supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('platform', p),
        ),
      ),
      Promise.all(
        DAYS.map((day) =>
          supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('day_of_week', day),
        ),
      ),
    ])

    const worksData = worksResult.data ?? []

    // 총 구매 편수 (purchase_count 합계)
    const totalPurchaseCount = worksData.reduce((sum, w) => sum + (w.purchase_count ?? 0), 0)

    // 가장 많이 쓴 플랫폼 (platform별 purchase_count 합 기준)
    const topPlatform =
      PLATFORMS.map((p) => ({
        platform: p,
        sum: worksData.filter((w) => w.platform === p).reduce((s, w) => s + (w.purchase_count ?? 0), 0),
      })).sort((a, b) => b.sum - a.sum)[0]?.platform ?? '-'

    // 웹소설 생활 기간 (첫 거래일 ~ 오늘)
    const firstDate = firstTxResult.data?.[0]?.date ?? null
    let lifeDuration = '-'
    if (firstDate) {
      const start = new Date(firstDate)
      const now = new Date()
      const totalMonths =
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
      lifeDuration = `${Math.floor(totalMonths / 12)}년 ${totalMonths % 12}개월`
    }

    // 플랫폼별 구매 건수 (도넛 차트)
    const platformCounts = PLATFORMS.map((platform, i) => ({
      platform,
      count: platformResults[i].count ?? 0,
    }))

    // 요일별 구매 건수 (바 차트)
    const dayOfWeekData = DAYS.map((day, i) => ({
      day,
      count: dowResults[i].count ?? 0,
    }))

    // Top 10 작품 — total_amount_krw는 정렬에만 사용, 컴포넌트에 전달 안 함
    const topWorks = (topWorksResult.data ?? []).map(({ platform, title, purchase_count }) => ({
      platform,
      title,
      purchase_count,
    }))

    return (
      <div className="space-y-6">
        <SummaryCards
          totalPurchaseCount={totalPurchaseCount}
          worksCount={worksCountResult.count ?? 0}
          topPlatform={topPlatform}
          lifeDuration={lifeDuration}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PlatformDonut data={platformCounts} />
          <DayOfWeekBar data={dayOfWeekData} />
        </div>
        <MonthlyLineChart data={monthlySummaryResult.data ?? []} />
        <TopWorksTable works={topWorks} />
      </div>
    )
  } catch {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    )
  }
}
