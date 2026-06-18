import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Vercel Serverless Function 최대 실행 시간 (Hobby: 10s, Pro: 최대 300s)
export const maxDuration = 60
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// 정적 시스템 프롬프트 — 요청마다 동일하므로 프롬프트 캐싱 대상
const STATIC_SYSTEM = `너는 사용자의 웹소설 결제 및 리뷰 데이터를 분석해주는 개인 AI 어시스턴트야.
사용자는 2018년부터 2026년까지 네이버 시리즈, 카카오페이지, 문피아에서
총 14,703건의 웹소설을 구매했어. 구매한 작품은 총 204개야.
장르 정보가 있는 작품은 works 테이블의 genre 컬럼을 참고해.

답변 규칙:
1. 한국어로 친근하고 자연스럽게 답해줘. 딱딱하지 않게.
2. 숫자는 항상 한국어 포맷으로 (예: 83,300원, 843건)
3. 데이터에 없는 내용을 지어내지 마. 없으면 없다고 솔직하게.
4. 추천할 때는 반드시 실제 리뷰/결제 데이터 근거를 들어줘.
5. 답변은 3~5문장으로 간결하게. 필요하면 불릿 리스트 사용.
6. 이모지를 적당히 써서 읽기 편하게 해줘.
7. 추천 질문이 들어오면:
   - 먼저 제공된 DB 데이터에서 사용자의 선호 장르와 고평점 작품을 파악해.
   - web_search 도구로 그 장르의 최신 인기 웹소설을 검색해줘 (예: "2025 무협 웹소설 추천", "최신 판타지 웹소설 인기작").
   - DB 데이터 근거와 웹 검색 결과를 결합해서 맞춤 추천을 해줘.
   - 검색 결과에서 찾은 작품은 "최신 인기작"임을 명시하고, DB에 있는 작품은 "내가 이미 본 작품"임을 구분해서 안내해줘.`

const GENRE_KEYWORDS = [
  '무협', '판타지', '로맨스', '현대', '회귀', '헌터',
  '아포칼립스', '게임', '먹방', '육아', '학원',
]

function classifyQuestion(msg: string): 'work_stats' | 'reviews' | 'recommendation' | 'genre' | 'summary' {
  if (/얼마|샀어|결제|구매/.test(msg)) return 'work_stats'
  if (/몇\s*점|평점|리뷰|별점|\d+점/.test(msg)) return 'reviews'
  if (/장르/.test(msg) || GENRE_KEYWORDS.some((g) => msg.includes(g))) return 'genre'
  if (/추천|좋아할|비슷한|취향/.test(msg)) return 'recommendation'
  return 'summary'
}

function extractTitle(message: string): string {
  return message
    .replace(/얼마나?|샀어|결제|구매|했어|어요|나요|봐|봤|읽었|몇\s*편|어떻게|알려줘|보여줘/g, ' ')
    .replace(/[?？]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchContext(message: string, type: string): Promise<unknown> {
  try {
    if (type === 'work_stats') {
      const title = extractTitle(message)
      const { data, error } = await supabase.rpc('get_work_stats', { p_title: title || message })
      if (error) {
        console.error('[chat] get_work_stats error:', error.message)
        throw error
      }
      return data ?? { message: '해당 작품을 찾을 수 없어요' }
    }
    if (type === 'reviews') {
      const { data, error } = await supabase
        .from('reviews')
        .select('title, platform, rating, short_review')
        .order('rating', { ascending: false })
        .limit(20)
      if (error) {
        console.error('[chat] reviews query error:', error.message)
        throw error
      }
      return data ?? []
    }
    if (type === 'recommendation') {
      const [ratedResult, worksResult] = await Promise.all([
        supabase.rpc('get_top_rated_works', { p_min_rating: 4.0 }),
        supabase
          .from('works')
          .select('genre, purchase_count')
          .not('genre', 'is', null)
          .neq('genre', '')
          .order('purchase_count', { ascending: false })
          .limit(50),
      ])
      if (ratedResult.error) {
        console.error('[chat] get_top_rated_works error:', ratedResult.error.message)
        throw ratedResult.error
      }
      // 복수 장르("무협, 판타지") 쉼표 분리 후 purchase_count 합산
      const genreMap: Record<string, number> = {}
      for (const row of worksResult.data ?? []) {
        if (!row.genre) continue
        for (const g of row.genre.split(',').map((s: string) => s.trim())) {
          if (g) genreMap[g] = (genreMap[g] ?? 0) + (row.purchase_count ?? 0)
        }
      }
      const topGenres = Object.entries(genreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre, purchase_count]) => ({ genre, purchase_count }))
      return {
        top_rated_works: ratedResult.data ?? [],
        top_genres: topGenres,
      }
    }
    if (type === 'genre') {
      const extractedGenre = GENRE_KEYWORDS.find((g) => message.includes(g)) ?? ''
      let query = supabase
        .from('works')
        .select('title, platform, author, genre, purchase_count')
        .order('purchase_count', { ascending: false })
        .limit(10)
      if (extractedGenre) {
        query = query.ilike('genre', `%${extractedGenre}%`)
      }
      const { data, error } = await query
      if (error) {
        console.error('[chat] genre query error (author/genre 컬럼 없을 수 있음):', error.message)
        // author/genre 컬럼이 DB에 없을 경우 기본 컬럼으로 폴백
        const { data: fallback, error: fbError } = await supabase
          .from('works')
          .select('title, platform, purchase_count')
          .order('purchase_count', { ascending: false })
          .limit(10)
        if (fbError) throw fbError
        return fallback ?? []
      }
      return data ?? []
    }
    // summary (default)
    const { data, error } = await supabase.rpc('get_spending_summary')
    if (error) {
      console.error('[chat] get_spending_summary error:', error.message)
      throw error
    }
    return data
  } catch (err) {
    console.error('[chat] fetchContext failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string
      session_id: string
      history: { role: 'user' | 'assistant'; content: string }[]
    }
    const { message, session_id, history } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해주세요' }, { status: 400 })
    }

    const questionType = classifyQuestion(message)
    const dataContext = await fetchContext(message, questionType)

    const isSearchType = questionType === 'recommendation' || questionType === 'genre'

    const systemBlocks = [
      {
        type: 'text' as const,
        text: STATIC_SYSTEM,
        cache_control: { type: 'ephemeral' as const },
      },
      {
        type: 'text' as const,
        text: `\n\n아래는 현재 질문과 관련된 실제 데이터야:\n${JSON.stringify(
          dataContext !== null
            ? dataContext
            : { error: 'DB를 불러오지 못했어요. schema.sql 실행과 CSV 임포트가 완료됐는지 확인해주세요.' },
          null,
          2,
        )}`,
      },
    ]

    const tools = isSearchType
      ? [{ type: 'web_search_20260209' as const, name: 'web_search' as const }]
      : undefined

    let currentMessages: Anthropic.MessageParam[] = [
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ]

    let assistantText = ''

    for (let iter = 0; iter < 5; iter++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: isSearchType ? 2000 : 1000,
        system: systemBlocks,
        messages: currentMessages,
        ...(tools ? { tools } : {}),
      })

      for (const block of response.content) {
        if (block.type === 'text') assistantText += block.text
      }

      if (response.stop_reason !== 'pause_turn') break

      // 서버사이드 도구 루프가 10회 한도에 도달하면 pause_turn 반환 — 전체 대화를 다시 전송해 재개
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content as Anthropic.ContentBlockParam[] },
      ]
    }

    // 대화 이력 저장
    await supabase.from('chat_messages').insert([
      { session_id, role: 'user', content: message },
      { session_id, role: 'assistant', content: assistantText },
    ])

    return NextResponse.json({ response: assistantText })
  } catch (err) {
    console.error('Chat API error:', err)
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
