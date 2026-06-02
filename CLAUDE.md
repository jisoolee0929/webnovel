# 웹소설 결제 트래커 — Claude Code 개발 프롬프트 (챗봇 포함 v2)

## 프로젝트 개요

웹소설 결제 데이터를 분석하고, 리뷰를 기록하며, AI 챗봇으로 내 소비/작품 데이터를 자연어로 조회할 수 있는 개인 대시보드.

- **스택**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase
- **AI 챗봇**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **배포**: Vercel
- **데이터**: 2018~2026년 14,703건 결제 내역 (문피아, 카카오페이지, 네이버 시리즈)

---

## 1단계 — 프로젝트 초기 세팅

```
아래 스펙으로 Next.js 프로젝트를 세팅해줘.

- Next.js 15, TypeScript, Tailwind CSS, App Router 사용
- 패키지 설치: @supabase/supabase-js, @anthropic-ai/sdk, recharts, lucide-react
- 환경변수 파일 .env.local 템플릿 생성:
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  ANTHROPIC_API_KEY=         ← 서버 전용 (NEXT_PUBLIC 붙이지 말 것)

- /lib/supabase.ts  : Supabase 클라이언트 싱글톤
- /lib/anthropic.ts : Anthropic 클라이언트 싱글톤 (서버 전용)

- 기본 레이아웃(layout.tsx):
  - 상단 네비게이션 바: 로고 + "대시보드" / "리뷰" 탭
  - 다크 모드 지원 (Tailwind dark: 클래스 사용)
  - 우측에 채팅 아이콘 버튼 → 클릭 시 사이드패널 열기/닫기
  - 사이드패널은 layout 레벨에서 전역 상태(useState)로 관리해서
    어느 페이지에서도 열 수 있게 할 것
```

---

## 2단계 — 대시보드 페이지 (`/`)

```
대시보드 페이지(/)를 만들어줘. Supabase에서 데이터를 fetch해서 아래 UI를 구성해.

[상단 요약 카드 4개]
- 총 구매 편수 (purchase_count 합계, "편" 단위: 14,703편)
- 읽은 작품 수 (works 테이블 row 수)
- 가장 많이 쓴 플랫폼 (platform별 purchase_count 합계 중 1위)
- 웹소설 생활 기간 (첫 거래일 ~ 오늘, "N년 N개월" 포맷)
- ⚠️ 총 결제 추정액은 카드에 표시하지 않음

[플랫폼별 비중 도넛 차트]
- transactions 테이블에서 platform별 구매 건수 (count) 기준
- 네이버 시리즈(#3B82F6) / 카카오페이지(#F59E0B) / 문피아(#10B981) 색상
- recharts PieChart 사용, 범례 포함
- ⚠️ amount_krw 기반 금액 비중은 표시하지 않음

[월별 구매 편수 추이 라인 차트]
- monthly_summary 테이블 전체 조회, year_month 오름차순 정렬
- x축: year_month, y축: count (편수)
- 플랫폼 3개 라인 색상 구분 (munpia_count / kakao_count / naver_count)
- recharts LineChart 사용
- x축 레이블은 6개월 간격으로만 표시
- ⚠️ total_amount / 금액 계열 컬럼은 차트에 사용하지 않음

[Top 10 작품 테이블]
- works 테이블에서 total_amount_krw 내림차순 10개
- 컬럼: 순위 / 작품명(클릭 시 상세 모달) / 플랫폼 배지 / 구매 편수
- ⚠️ 금액(total_amount_krw)은 화면에 표시하지 않음 — 편수만 노출

[요일별 구매 편수 바 차트]
- transactions에서 day_of_week별 count (건수만, amount_krw 합계는 사용 안 함)
- 월화수목금토일 순서 고정
- recharts BarChart 사용

모든 섹션은 로딩 스켈레톤 UI 포함, 에러 상태 처리 필수.
```

---

## 3단계 — 리뷰 페이지 (`/reviews`)

```
리뷰 기록 페이지(/reviews)를 만들어줘.

[상단 통계]
- 총 리뷰 수, 평균 평점, 평점 분포 바 차트 (0.5~5.0, recharts)
- 리뷰 5개 미만이면 차트 숨김

[필터 & 검색]
- 작품명 검색 input (클라이언트 사이드 필터링)
- 플랫폼 필터 버튼: 전체 / 네이버 시리즈 / 카카오페이지 / 문피아
- 평점 필터: 전체 / ⭐4점 이상 / ⭐3점 이상

[리뷰 카드 목록]
- reviews 테이블 전체 조회, updated_at 내림차순
- 카드 레이아웃:
  - 작품명 (클릭 시 작품 상세 모달)
  - 플랫폼 컬러 배지
  - 별점 UI (채워진 별 / 반 별 / 빈 별)
  - 읽은 기간 (read_start_date ~ read_end_date)
  - 리뷰 본문 (2줄 이상이면 "더보기" 토글)
  - 수정 / 삭제 아이콘 버튼

[우하단 플로팅 버튼 (+)]
- 클릭 시 리뷰 작성 모달 오픈

[리뷰 작성/수정 모달]
- 입력 필드:
  - 작품명 (필수)
  - 플랫폼 (셀렉트: 네이버 시리즈 / 카카오페이지 / 문피아 / 기타)
  - 읽기 시작 날짜 / 다 읽은 날짜
  - 평점: 별 클릭 UI, 0.5점 단위 (반 별 지원)
  - 짧은 리뷰 textarea (500자 제한, 글자 수 카운터 표시)
- 저장 / 취소 버튼
- Supabase insert(작성) / update(수정) 처리 후 목록 갱신

[삭제]
- 삭제 버튼 클릭 → 확인 다이얼로그 → Supabase delete
```

---

## 4단계 — 작품 상세 모달

```
대시보드 Top 10 테이블 또는 리뷰 카드에서 작품명 클릭 시 모달을 띄워줘.

[모달 내용]
- 작품명, 플랫폼 배지
- 구매 편수 (purchase_count) — 총 결제 추정액·금액·날짜는 화면에 표시하지 않음
- 월별 구매 편수 미니 바 차트
  (transactions에서 해당 title 필터 → year_month별 count만 집계,
   금액(amount_krw)은 쿼리에서 조회하되 차트에 표시하지 않음)
- 내가 남긴 리뷰 섹션
  - 있으면: 평점 + 리뷰 내용 표시
  - 없으면: "아직 리뷰가 없어요" + "리뷰 작성하기" 버튼
  - 버튼 클릭 시 리뷰 모달 오픈 (작품명 & 플랫폼 자동 입력)

⚠️ 상세 모달에서 숨길 정보 (DB 조회는 하되 렌더링 금지):
- total_amount_krw (총 결제 추정액)
- first_date / last_date (첫/마지막 구매일)
- amount_krw 기반 집계값 일체
```

---

## 5단계 — AI 챗봇 사이드패널

```
레이아웃 우측에 슬라이드인 형태의 챗봇 사이드패널을 만들어줘.
Anthropic Claude API를 사용해서 내 웹소설 데이터 관련 질문에 답하는 챗봇이야.

─────────────────────────────────────────
[UI 스펙]
─────────────────────────────────────────
- 사이드패널 너비: 380px (모바일에서는 화면 전체)
- 우측에서 슬라이드인 애니메이션 (transition-transform)
- 헤더: "📚 웹소설 AI" + 닫기(X) 버튼 + 대화 초기화 버튼(🗑)
- 메시지 영역: 스크롤 가능, 유저/어시스턴트 말풍선 구분
- 입력창: textarea (Enter 전송, Shift+Enter 줄바꿈) + 전송 버튼
- 어시스턴트 응답 중일 때 typing indicator (점 3개 애니메이션)
- 추천 질문 버튼 (대화 시작 전 또는 대화 초기화 후 표시):
  - "내가 제일 많이 쓴 달은 언제야?"
  - "화산귀환 얼마나 샀어?"
  - "5점 준 작품 알려줘"
  - "내 취향에 맞는 작품 추천해줘"

─────────────────────────────────────────
[API Route: /api/chat (POST)]
─────────────────────────────────────────
요청 body: { message: string, session_id: string, history: {role, content}[] }

처리 흐름:
1. 질문 유형 분류 (직접 분기 처리, 별도 LLM 호출 없이):
   - "작품명 + 얼마/샀어/결제" 패턴 → Supabase get_work_stats(title) 호출
   - "몇 점/평점/리뷰" 키워드 → reviews 테이블 조회
   - "추천/좋아할/비슷한" 키워드 → get_top_rated_works() + works 상위 목록 조회
   - 그 외 전부 → get_spending_summary() 호출

2. 조회한 데이터를 system prompt context에 JSON으로 포함

3. Anthropic API 호출 (claude-sonnet-4-20250514):
   - max_tokens: 1000
   - system prompt (아래 참고)

4. 응답을 chat_messages 테이블에 저장 (user + assistant 각 1행)

5. 응답 텍스트 반환

─────────────────────────────────────────
[System Prompt]
─────────────────────────────────────────
아래 내용을 그대로 system prompt로 사용해줘:

"""
너는 사용자의 웹소설 결제 및 리뷰 데이터를 분석해주는 개인 AI 어시스턴트야.
사용자는 2018년부터 2026년까지 네이버 시리즈, 카카오페이지, 문피아에서
총 14,703건, 약 146만원 어치의 웹소설을 구매했어.

아래는 현재 질문과 관련된 실제 데이터야:
{data_context}

답변 규칙:
1. 한국어로 친근하고 자연스럽게 답해줘. 딱딱하지 않게.
2. 숫자는 항상 한국어 포맷으로 (예: 83,300원, 843건)
3. 데이터에 없는 내용을 지어내지 마. 없으면 없다고 솔직하게.
4. 추천할 때는 반드시 실제 리뷰/결제 데이터 근거를 들어줘.
5. 답변은 3~5문장으로 간결하게. 필요하면 불릿 리스트 사용.
6. 이모지를 적당히 써서 읽기 편하게 해줘.
"""

─────────────────────────────────────────
[대화 이력 관리]
─────────────────────────────────────────
- 클라이언트에서 messages 배열을 useState로 관리
- API 호출 시 최근 10개 메시지만 history로 전달 (토큰 절약)
- "대화 초기화" 버튼 클릭 시: 클라이언트 state 초기화 + 
  해당 session_id의 chat_messages Supabase 행 삭제
- session_id는 컴포넌트 마운트 시 crypto.randomUUID()로 생성
```

---

## 6단계 — Vercel 배포 설정

```
Vercel 배포를 위한 설정을 추가해줘.

- next.config.ts 확인 (이미지 도메인 등)
- README.md 작성:

  ## 로컬 실행
  1. npm install
  2. .env.local 파일 생성 후 아래 3개 값 입력:
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     ANTHROPIC_API_KEY
  3. npm run dev

  ## Supabase 초기 세팅
  1. Supabase 프로젝트 생성
  2. SQL Editor에서 schema.sql 전체 실행
  3. Table Editor에서 CSV 임포트 (순서 중요):
     monthly_summary.csv → works.csv → transactions.csv
  4. ANTHROPIC_API_KEY는 Anthropic Console에서 발급

  ## Vercel 배포
  1. GitHub에 push
  2. Vercel에서 GitHub 레포 import
  3. Environment Variables에 .env.local의 3개 값 입력
  4. Deploy
```

---

## DB 테이블 구조 참고

### transactions
| 컬럼 | 타입 | 설명 |
|------|------|------|
| transaction_id | TEXT | 원본 거래ID |
| platform | TEXT | 네이버 시리즈 / 카카오페이지 / 문피아 |
| date | DATE | 거래 날짜 |
| year_month | TEXT | YYYY-MM |
| year | INT | 연도 |
| day_of_week | TEXT | 월~일 |
| hour | INT | 0~23 / -1(네이버 시리즈, 시간 없음) |
| title | TEXT | 작품명 |
| status | TEXT | 정상 / 구매 / 취소 / 대여기간 만료 |
| amount_krw | INT | 추정금액(원), 취소는 음수 |

### works
| 컬럼 | 타입 | 설명 |
|------|------|------|
| platform | TEXT | 플랫폼 |
| title | TEXT | 작품명 |
| purchase_count | INT | 총 구매 건수 |
| total_amount_krw | INT | 총 결제 추정액 |
| first_date | DATE | 첫 구매일 |
| last_date | DATE | 마지막 구매일 |

### reviews
| 컬럼 | 타입 | 설명 |
|------|------|------|
| platform | TEXT | 플랫폼 |
| title | TEXT | 작품명 |
| read_start_date | DATE | 읽기 시작 날짜 |
| read_end_date | DATE | 다 읽은 날짜 |
| rating | NUMERIC(2,1) | 0.5~5.0 평점 |
| short_review | TEXT | 짧은 리뷰 |

### monthly_summary
| 컬럼 | 타입 | 설명 |
|------|------|------|
| year_month | TEXT | YYYY-MM |
| total_amount | INT | 월 총 결제 추정액 |
| munpia/kakao/naver _amount | INT | 플랫폼별 결제액 |

### chat_messages (챗봇 이력)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| session_id | TEXT | 대화 세션 UUID |
| role | TEXT | 'user' 또는 'assistant' |
| content | TEXT | 메시지 내용 |

---

## 데이터 특이사항

- 네이버 시리즈는 hour = -1 (시간 없음) → 시간대 차트 및 챗봇 응답에서 -1 제외
- 취소건 amount_krw 음수 → 총액 집계 시 WHERE amount_krw > 0 조건 필수
- 같은 작품이 여러 플랫폼에 존재 가능 (예: 약먹는 천재마법사)
  → works는 (platform + title) 조합으로 식별
- ANTHROPIC_API_KEY는 절대 클라이언트 컴포넌트에서 직접 사용 금지
  → 반드시 /api/chat API Route 통해서만 호출할 것

---

## ⚠️ 화면 노출 제한 정책 (반드시 준수)

배포 환경에서 타인에게 노출될 수 있으므로, 아래 정보는 **화면에 절대 렌더링하지 않음**.
DB 조회나 챗봇 내부 처리에는 사용 가능하지만, JSX/HTML로 출력되어선 안 됨.

| 숨길 정보 | 허용 대체 표시 |
|-----------|---------------|
| 결제 금액 (amount_krw, total_amount_krw 등) | 구매 편수 (purchase_count, count) |
| 첫 구매일 / 마지막 구매일 (first_date, last_date) | 웹소설 생활 기간 ("N년 N개월") |
| 월별 금액 추이 | 월별 구매 편수 추이 |
| 요일별 결제 금액 패턴 | 요일별 구매 편수 패턴 |
| 플랫폼별 결제 금액 비중 | 플랫폼별 구매 편수 비중 |

챗봇(/api/chat 서버)은 이 제한 없이 모든 데이터를 조회하고 답변할 수 있음.

---

## 구현 완료 현황

### ✅ 1단계 — 프로젝트 초기 세팅 (2026-06-02 완료)

**환경**
- Next.js 16.2.7 (App Router) + TypeScript + Tailwind CSS v4
- Tailwind v4는 `tailwind.config.ts` 없이 CSS `@import "tailwindcss"` 방식 사용
- 다크 모드: `@media (prefers-color-scheme: dark)` 시스템 설정 감지 방식

**생성된 파일**

| 파일 | 설명 |
|------|------|
| `lib/supabase.ts` | Supabase 브라우저 클라이언트 싱글톤 (`createClient`) |
| `lib/anthropic.ts` | Anthropic 클라이언트 싱글톤 (`import 'server-only'` 보호) |
| `components/ClientLayout.tsx` | `'use client'` — 챗봇 사이드패널 열림/닫힘 전역 상태 관리 |
| `components/Navbar.tsx` | 로고 + 대시보드/리뷰 탭 + AI챗봇 버튼 (active 탭 하이라이트) |
| `components/ChatSidebar.tsx` | 슬라이드인 사이드패널 skeleton (5단계에서 챗봇 로직 구현 예정) |
| `app/layout.tsx` | 루트 레이아웃 — `lang="ko"`, 메타데이터, `ClientLayout` 포함 |
| `app/page.tsx` | 대시보드 placeholder (2단계에서 구현) |
| `app/reviews/page.tsx` | 리뷰 placeholder (3단계에서 구현) |

**레이아웃 아키텍처**
```
app/layout.tsx (Server Component)
  └─ ClientLayout (Client Component, useState)
       ├─ Navbar (로고, 탭, 챗봇 버튼)
       ├─ <main> (각 페이지 children)
       └─ ChatSidebar (슬라이드인 패널)
```

**설치된 패키지**
```
@supabase/supabase-js  @anthropic-ai/sdk  recharts  lucide-react  server-only
```

**테스트 결과**
- `npm run build` → TypeScript 오류 없음
- `GET /` → 200 OK, `<title>웹소설 트래커</title>` 확인
- `GET /reviews` → 200 OK
- `.env.local` 로드 확인 (빌드 시 Environments: .env.local 출력됨)
