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
        .select('platform, title, purchase_count')
        .order('purchase_count', { ascending: false }),
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

    // Supabase 는 에러를 throw 하지 않고 { error } 로 반환 — 명시적으로 확인
    if (worksResult.error) throw new Error(worksResult.error.message)
    if (firstTxResult.error) throw new Error(firstTxResult.error.message)

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

    // 작품 랭킹 — purchase_count 내림차순
    const topWorks = topWorksResult.data ?? []

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    const isNotFound = msg.includes('schema cache') || msg.includes('does not exist')

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold text-red-500">데이터를 불러오지 못했습니다</p>
        {isNotFound ? (
          <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-5 text-left dark:border-amber-800 dark:bg-amber-900/20">
            <p className="mb-3 font-medium text-amber-800 dark:text-amber-300">
              Supabase DB 초기 설정이 필요합니다
            </p>
            <ol className="list-decimal space-y-1.5 pl-4 text-sm text-amber-700 dark:text-amber-400">
              <li>Supabase 대시보드 → SQL Editor</li>
              <li>프로젝트의 <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">schema.sql</code> 전체 내용을 붙여넣고 실행</li>
              <li>Table Editor → CSV 임포트 (순서 중요):<br />
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">monthly_summary.csv → works.csv → transactions.csv</code>
              </li>
            </ol>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{msg}</p>
        )}
      </div>
    )
  }
}
