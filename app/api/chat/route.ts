import { NextRequest, NextResponse } from 'next/server'

// Vercel Serverless Function 최대 실행 시간 (Hobby: 10s, Pro: 최대 300s)
export const maxDuration = 30
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// 정적 시스템 프롬프트 — 요청마다 동일하므로 프롬프트 캐싱 대상
const STATIC_SYSTEM = `너는 사용자의 웹소설 결제 및 리뷰 데이터를 분석해주는 개인 AI 어시스턴트야.
사용자는 2018년부터 2026년까지 네이버 시리즈, 카카오페이지, 문피아에서
총 14,703건, 약 146만원 어치의 웹소설을 구매했어.

답변 규칙:
1. 한국어로 친근하고 자연스럽게 답해줘. 딱딱하지 않게.
2. 숫자는 항상 한국어 포맷으로 (예: 83,300원, 843건)
3. 데이터에 없는 내용을 지어내지 마. 없으면 없다고 솔직하게.
4. 추천할 때는 반드시 실제 리뷰/결제 데이터 근거를 들어줘.
5. 답변은 3~5문장으로 간결하게. 필요하면 불릿 리스트 사용.
6. 이모지를 적당히 써서 읽기 편하게 해줘.`

function classifyQuestion(msg: string): 'work_stats' | 'reviews' | 'recommendation' | 'summary' {
  if (/얼마|샀어|결제|구매/.test(msg)) return 'work_stats'
  if (/몇\s*점|평점|리뷰|별점|\d+점/.test(msg)) return 'reviews'
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
      if (error) throw error
      return data ?? { message: '해당 작품을 찾을 수 없어요' }
    }
    if (type === 'reviews') {
      const { data, error } = await supabase
        .from('reviews')
        .select('title, platform, rating, short_review')
        .order('rating', { ascending: false })
        .limit(20)
      if (error) throw error
      return data ?? []
    }
    if (type === 'recommendation') {
      const { data, error } = await supabase.rpc('get_top_rated_works', { p_min_rating: 4.0 })
      if (error) throw error
      // RPC가 null 반환 = 평점 높은 리뷰 없음 (DB 오류 아님)
      return data ?? []
    }
    // summary (default)
    const { data, error } = await supabase.rpc('get_spending_summary')
    if (error) throw error
    return data
  } catch {
    // 실제 오류(테이블 없음, 네트워크 등)만 null 반환
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: [
        {
          type: 'text',
          text: STATIC_SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `\n\n아래는 현재 질문과 관련된 실제 데이터야:\n${JSON.stringify(
            dataContext !== null
              ? dataContext
              : { error: 'DB를 불러오지 못했어요. schema.sql 실행과 CSV 임포트가 완료됐는지 확인해주세요.' },
            null,
            2,
          )}`,
        },
      ],
      messages: [
        ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ],
    })

    let assistantText = ''
    for (const block of response.content) {
      if (block.type === 'text') assistantText += block.text
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
