# 웹소설 결제 트래커 — 개발 플랜

> 작성일: 2026-06-02  
> 기준 문서: CLAUDE.md  
> 현재 상태: 레포 초기화 완료, schema.sql + 데이터 CSV 준비됨

---

## 사전 확인 사항

| 항목 | 상태 | 비고 |
|------|------|------|
| `schema.sql` | ✅ 완성 | Supabase에 아직 미적용 |
| `data/transactions.csv` | ✅ 존재 | 14,703건 |
| `data/works.csv` | ✅ 존재 | 235개 작품 |
| `data/monthly_summary.csv` | ✅ 존재 | 2018-03 ~ 2026-06 |
| `meta.json` | ✅ 존재 | 통계 스냅샷 |
| Next.js 앱 | ❌ 미생성 | 1단계에서 생성 |

### 개발 전 필요한 외부 계정/키
- [ ] **Supabase** 프로젝트 생성 → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확보
- [ ] **Anthropic Console** → `ANTHROPIC_API_KEY` 발급 (서버 전용)
- [ ] **Vercel** 계정 (6단계 배포 시)

---

## 개발 단계 개요

```
1단계  프로젝트 초기 세팅        ← Next.js 앱 뼈대 + 레이아웃
   ↓
2단계  대시보드 페이지 (/)       ← 차트 4종 + 요약 카드
   ↓
3단계  리뷰 페이지 (/reviews)    ← CRUD + 별점 UI
   ↓
4단계  작품 상세 모달             ← 대시보드·리뷰 공용 컴포넌트
   ↓
5단계  AI 챗봇 사이드패널         ← Anthropic API + /api/chat
   ↓
6단계  Vercel 배포 설정           ← next.config.ts + README
```

---

## 1단계 — 프로젝트 초기 세팅

**목표**: Next.js 앱 생성, 공통 인프라 파일 작성, 전역 레이아웃 구성

### 1-1. Next.js 프로젝트 생성
```bash
npx create-next-app@latest . \
  --typescript --tailwind --app \
  --no-src-dir --import-alias "@/*"
```

### 1-2. 패키지 추가 설치
```bash
npm install @supabase/supabase-js @anthropic-ai/sdk recharts lucide-react
```

### 1-3. 파일 생성 목록
| 파일 | 내용 |
|------|------|
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `ANTHROPIC_API_KEY` |
| `lib/supabase.ts` | Supabase 브라우저 클라이언트 싱글톤 (`createBrowserClient`) |
| `lib/supabase-server.ts` | 서버 전용 클라이언트 (`createServerClient`) |
| `lib/anthropic.ts` | Anthropic 클라이언트 싱글톤 — `'server-only'` 임포트 포함 |

### 1-4. 레이아웃 (`app/layout.tsx`)
- 전역 `useState`로 챗봇 사이드패널 열림/닫힘 관리 (`'use client'` 래퍼 컴포넌트 분리)
- 상단 네비게이션 바: 로고 + `/`(대시보드) + `/reviews`(리뷰) 탭
- 다크 모드: Tailwind `dark:` 클래스 기반 (시스템 설정 감지)
- 우측 채팅 아이콘 버튼 → 사이드패널 토글
- 사이드패널 컴포넌트는 5단계에서 내용 채울 자리(skeleton) 미리 배치

### 주의사항
- `ANTHROPIC_API_KEY`는 `NEXT_PUBLIC_` 접두사 **절대 금지** — 클라이언트 번들 노출 방지
- 레이아웃은 Server Component로 유지하되, 상태가 필요한 부분만 Client Component로 분리

### 완료 기준
- [ ] `npm run dev` 실행 시 localhost:3000 접속 성공
- [ ] 네비 탭 클릭으로 `/` ↔ `/reviews` 라우팅 동작
- [ ] `.env.local` 환경변수 로딩 확인

---

## 2단계 — 대시보드 페이지 (`/`)

**목표**: Supabase 데이터 fetch + 4종 시각화 + 요약 카드

### 2-1. 데이터 fetch 설계 (서버 컴포넌트에서 병렬 호출)
```
Promise.all([
  supabase.from('works').select('platform, purchase_count'),   // 요약 카드 1·2·3
  supabase.from('transactions').select('platform, date'),      // 요약 카드 4 + 도넛 차트
  supabase.from('monthly_summary').select(...).order('year_month'),  // 라인 차트
  supabase.from('works').select('title, platform, purchase_count')   // Top 10 테이블
    .order('total_amount_krw', { ascending: false }).limit(10),
  supabase.from('transactions_public').select('day_of_week'),  // 요일 바 차트
])
```

### 2-2. 컴포넌트 목록
| 컴포넌트 | 위치 | 비고 |
|---------|------|------|
| `SummaryCards` | `components/dashboard/` | 4개 카드, 스켈레톤 포함 |
| `PlatformDonut` | `components/dashboard/` | recharts PieChart |
| `MonthlyLineChart` | `components/dashboard/` | recharts LineChart, `'use client'` |
| `TopWorksTable` | `components/dashboard/` | 클릭 시 4단계 모달 오픈 |
| `DayOfWeekBar` | `components/dashboard/` | recharts BarChart |

### 2-3. 요약 카드 계산 로직
| 카드 | 데이터 소스 | 계산 |
|------|------------|------|
| 총 구매 편수 | `works.purchase_count` 합계 | `SUM(purchase_count)` |
| 읽은 작품 수 | `works` 행 수 | `COUNT(*)` |
| 가장 많이 쓴 플랫폼 | `works` platform별 `purchase_count` 합 | `argmax` |
| 웹소설 생활 기간 | `transactions.date` MIN → today | "N년 N개월" 포맷 |

### 2-4. 차트 색상 규칙
| 플랫폼 | HEX |
|--------|-----|
| 네이버 시리즈 | `#3B82F6` |
| 카카오페이지 | `#F59E0B` |
| 문피아 | `#10B981` |

### 화면 노출 제한 체크
- ❌ `amount_krw` / `total_amount_krw` → JSX에서 렌더링 금지
- ❌ `first_date` / `last_date` → 렌더링 금지 (기간 계산에만 사용)
- ✅ `purchase_count`, `count` 편수 계열만 노출

### 완료 기준
- [ ] 4개 요약 카드 데이터 정확히 표시
- [ ] 도넛 차트 플랫폼 3개 색상 구분
- [ ] 라인 차트 x축 6개월 간격 레이블
- [ ] Top 10 테이블 작품명 클릭 → 모달 placeholder 오픈
- [ ] 로딩 중 스켈레톤 UI 표시

---

## 3단계 — 리뷰 페이지 (`/reviews`)

**목표**: 리뷰 CRUD + 별점 UI + 필터/검색

### 3-1. 데이터 구조
```typescript
// Supabase reviews 테이블 타입
type Review = {
  id: number
  platform: string
  title: string
  read_start_date: string | null
  read_end_date: string | null
  rating: number            // 0.5 단위
  short_review: string | null
  updated_at: string
}
```

### 3-2. 컴포넌트 목록
| 컴포넌트 | 기능 |
|---------|------|
| `ReviewStats` | 총 리뷰 수, 평균 평점, 평점 분포 바 차트 (5개 미만 숨김) |
| `ReviewFilters` | 검색 input + 플랫폼 버튼 + 평점 필터 |
| `ReviewCard` | 별점 UI + 기간 + 본문 더보기 + 수정/삭제 버튼 |
| `ReviewModal` | 작성/수정 모달 (별 클릭 0.5점 단위) |
| `StarRating` | 채워진 별 / 반 별 / 빈 별 — 재사용 가능 |
| `FloatingAddButton` | 우하단 + 버튼 |

### 3-3. 별점 UI 구현 포인트
- 별 5개, 클릭 위치(왼쪽 절반/오른쪽 절반)로 0.5점 단위 구분
- `onMouseMove`로 hover 미리보기, `onClick`으로 확정

### 3-4. 모달 입력 유효성 검사
- 작품명: 필수, 공백만 불가
- 평점: 필수 (0.5~5.0)
- 리뷰 본문: 500자 제한, 글자 수 실시간 카운터
- 플랫폼: 네이버 시리즈 / 카카오페이지 / 문피아 / 기타

### 3-5. Supabase 연동
```typescript
// 작성
supabase.from('reviews').insert({ ... })
// 수정
supabase.from('reviews').update({ ... }).eq('id', id)
// 삭제
supabase.from('reviews').delete().eq('id', id)
```

### 완료 기준
- [ ] 리뷰 목록 로드 (updated_at 내림차순)
- [ ] 작성/수정/삭제 후 목록 즉시 갱신 (낙관적 업데이트 또는 재조회)
- [ ] 별점 0.5점 단위 UI 동작
- [ ] 검색·플랫폼·평점 필터 클라이언트 사이드 동작
- [ ] 리뷰 본문 2줄 이상 시 더보기 토글

---

## 4단계 — 작품 상세 모달

**목표**: 대시보드 Top 10 + 리뷰 카드 공용 모달 컴포넌트

### 4-1. Props 인터페이스
```typescript
type WorkModalProps = {
  title: string
  platform: string
  isOpen: boolean
  onClose: () => void
  onOpenReviewModal?: (title: string, platform: string) => void
}
```

### 4-2. 데이터 fetch (모달 오픈 시 병렬 호출)
```typescript
Promise.all([
  // 작품 기본 정보 (편수만, 금액 제외)
  supabase.from('works_public').select('*').eq('title', title).eq('platform', platform),
  // 월별 구매 편수 (count만)
  supabase.from('transactions_public')
    .select('year_month')
    .eq('title', title)
    .eq('amount_krw', ...)   // 주의: transactions_public 뷰는 amount_krw 없음
  // 리뷰
  supabase.from('reviews').select('*').eq('title', title).limit(1),
])
```

> `transactions_public` 뷰에는 `amount_krw`가 없으므로 count 집계는
> `year_month`별 그룹핑을 JS에서 처리하거나, Supabase RPC 활용

### 4-3. 모달 내 미니 바 차트
- `recharts BarChart`, 높이 120px
- x축: `year_month` (YYYY-MM), y축: 해당 월 구매 count
- 색상은 플랫폼 색상 사용

### 4-4. 화면 노출 제한 체크
- ❌ `total_amount_krw`, `first_date`, `last_date` 렌더링 금지
- ✅ `purchase_count`만 표시

### 완료 기준
- [ ] 대시보드 Top 10 테이블에서 작품명 클릭 → 모달 오픈
- [ ] 리뷰 카드에서 작품명 클릭 → 동일 모달 오픈
- [ ] 리뷰 없으면 "아직 리뷰가 없어요" + "리뷰 작성하기" 버튼
- [ ] 리뷰 작성하기 클릭 → 리뷰 모달에 작품명·플랫폼 자동 입력

---

## 5단계 — AI 챗봇 사이드패널

**목표**: Anthropic Claude API 연동, 웹소설 데이터 기반 자연어 Q&A

### 5-1. 파일 구조
```
app/api/chat/route.ts          ← POST 핸들러
components/chat/ChatPanel.tsx  ← 사이드패널 UI ('use client')
components/chat/ChatMessage.tsx
components/chat/TypingIndicator.tsx
components/chat/SuggestedQuestions.tsx
lib/anthropic.ts               ← 기존 싱글톤 활용
```

### 5-2. API Route 처리 흐름
```
POST /api/chat
  ├─ body: { message, session_id, history (최근 10개) }
  │
  ├─ [질문 분류] (키워드 기반, LLM 추가 호출 없음)
  │   ├─ "얼마|샀어|결제" + 작품명 → get_work_stats(title)
  │   ├─ "몇 점|평점|리뷰" → reviews 테이블 직접 조회
  │   ├─ "추천|좋아할|비슷한" → get_top_rated_works() + works 상위
  │   └─ 그 외 → get_spending_summary()
  │
  ├─ [Anthropic API 호출]
  │   model: "claude-sonnet-4-20250514"
  │   max_tokens: 1000
  │   system: 아래 system prompt (data_context 치환)
  │   messages: history + 현재 message
  │
  ├─ [DB 저장] chat_messages에 user + assistant 각 1행 insert
  │
  └─ 응답 텍스트 반환
```

### 5-3. System Prompt 템플릿
```
너는 사용자의 웹소설 결제 및 리뷰 데이터를 분석해주는 개인 AI 어시스턴트야.
사용자는 2018년부터 2026년까지 네이버 시리즈, 카카오페이지, 문피아에서
총 14,703건, 약 146만원 어치의 웹소설을 구매했어.

아래는 현재 질문과 관련된 실제 데이터야:
{data_context}   ← Supabase 조회 결과 JSON

답변 규칙:
1. 한국어로 친근하고 자연스럽게 답해줘.
2. 숫자는 한국어 포맷으로 (예: 83,300원, 843건)
3. 데이터에 없는 내용은 지어내지 마.
4. 추천 시 실제 리뷰/결제 데이터 근거 명시.
5. 3~5문장 간결하게, 필요 시 불릿 리스트.
6. 이모지를 적당히 사용.
```

### 5-4. ChatPanel UI 스펙
| 요소 | 상세 |
|------|------|
| 너비 | 380px (모바일: 100vw) |
| 애니메이션 | `translate-x-full` ↔ `translate-x-0` transition |
| 헤더 | "📚 웹소설 AI" + X(닫기) + 🗑(초기화) |
| 입력 | `<textarea>` Enter=전송, Shift+Enter=줄바꿈 |
| Typing indicator | 점 3개 bounce 애니메이션 (`animate-bounce` stagger) |
| 추천 질문 | 대화 없을 때 또는 초기화 후 4개 버튼 표시 |

### 5-5. 세션 관리
```typescript
// 컴포넌트 마운트 시 1회 생성
const [sessionId] = useState(() => crypto.randomUUID())
// history: 최근 10개만 slice
const recentHistory = messages.slice(-10)
// 초기화: state 리셋 + DB 삭제
await supabase.from('chat_messages').delete().eq('session_id', sessionId)
```

### 완료 기준
- [ ] 사이드패널 슬라이드인/아웃 애니메이션
- [ ] 챗봇 응답 중 typing indicator 표시
- [ ] 4개 추천 질문 버튼 동작
- [ ] 질문 유형별 올바른 Supabase 함수 호출
- [ ] 대화 초기화 후 DB 레코드 삭제 확인
- [ ] ANTHROPIC_API_KEY 클라이언트 미노출 확인

---

## 6단계 — Vercel 배포 설정

**목표**: 프로덕션 배포 준비 및 README 작성

### 6-1. `next.config.ts` 확인 사항
```typescript
const nextConfig = {
  // 외부 이미지 도메인 필요 시 추가
  images: { remotePatterns: [] },
  // Supabase 연동 시 필요한 헤더 설정 여부 확인
}
```

### 6-2. 환경변수 보안 점검
- [ ] `.env.local` → `.gitignore` 포함 여부 확인
- [ ] `ANTHROPIC_API_KEY` 서버 컴포넌트/API Route에서만 접근 확인
- [ ] Vercel 대시보드에 3개 환경변수 입력 가이드 명시

### 6-3. README.md 구성
1. 로컬 실행 방법
2. Supabase 초기 세팅 (schema.sql → CSV 임포트 순서)
3. Vercel 배포 절차

### 6-4. 배포 체크리스트
- [ ] `npm run build` 오류 없음 (TypeScript 에러 0건)
- [ ] Vercel Preview 배포 후 전체 기능 동작 확인
- [ ] Supabase RLS 정책 — reviews/chat_messages 쓰기 허용, 나머지 읽기 전용

---

## 공통 주의사항 (모든 단계 공통)

### 화면 노출 제한 정책
| 숨길 정보 | 대체 표시 |
|-----------|-----------|
| `amount_krw`, `total_amount_krw` | `purchase_count`, `count` |
| `first_date`, `last_date` | "N년 N개월" 기간만 |
| 월별/요일별 결제 금액 | 월별/요일별 구매 편수 |
| 플랫폼별 결제 금액 비중 | 플랫폼별 편수 비중 |

> 챗봇 서버(`/api/chat`)는 이 제한 없이 모든 데이터 활용 가능

### Supabase 뷰 사용 규칙
- 클라이언트에서 작품 조회 → `works_public` 뷰 사용 (`total_amount_krw` 없음)
- 클라이언트에서 거래 조회 → `transactions_public` 뷰 사용 (`amount_krw` 없음)
- 서버(`/api/chat`)에서는 원본 테이블 직접 사용 가능

### 데이터 특이사항
- 네이버 시리즈 `hour = -1` → 시간대 차트/집계에서 제외
- 취소건 `amount_krw < 0` → 총액 집계 시 `WHERE amount_krw > 0` 필수
- 같은 작품이 여러 플랫폼에 존재 → `(platform, title)` 복합 키로 식별

---

## 예상 개발 일정

| 단계 | 예상 소요 | 우선순위 |
|------|----------|---------|
| 1단계 초기 세팅 | 1~2시간 | 필수 선행 |
| 2단계 대시보드 | 3~4시간 | 핵심 |
| 3단계 리뷰 | 3~4시간 | 핵심 |
| 4단계 상세 모달 | 1~2시간 | 2·3단계 의존 |
| 5단계 챗봇 | 2~3시간 | Anthropic API 키 필요 |
| 6단계 배포 | 1시간 | 마지막 |

**총 예상: 11~16시간**
