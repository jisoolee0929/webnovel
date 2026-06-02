# 웹소설 결제 트래커

웹소설 결제 데이터를 분석하고, 리뷰를 기록하며, AI 챗봇으로 내 소비/작품 데이터를 자연어로 조회할 수 있는 개인 대시보드.

**스택**: Next.js 15 · TypeScript · Tailwind CSS v4 · Supabase · Anthropic Claude API  
**배포**: Vercel

---

## 로컬 실행

1. 저장소 클론 및 패키지 설치
   ```bash
   git clone <repo-url>
   cd webnovel
   npm install
   ```

2. `.env.local` 파일 생성 후 아래 3개 값 입력:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. 개발 서버 실행
   ```bash
   npm run dev
   ```
   → http://localhost:3000

---

## Supabase 초기 세팅

**순서를 반드시 지킬 것** (외래키 의존 관계 있음)

1. [Supabase](https://supabase.com) 프로젝트 생성

2. **SQL Editor**에서 `schema.sql` 전체 내용을 붙여넣고 실행  
   (테이블, 뷰, RPC 함수 모두 생성됨)

3. **Table Editor → Import data (CSV)** 순서대로 임포트:
   1. `data/monthly_summary.csv` → `monthly_summary` 테이블
   2. `data/works.csv` → `works` 테이블
   3. `data/transactions.csv` → `transactions` 테이블  
   ⚠️ transactions는 마지막에 임포트할 것 (works 의존)

4. Supabase 프로젝트 설정에서 URL과 anon key 복사 → `.env.local`에 입력

---

## Anthropic API 키 발급

1. [Anthropic Console](https://console.anthropic.com) 접속
2. **API Keys** → **Create Key**
3. 발급된 키를 `.env.local`의 `ANTHROPIC_API_KEY`에 입력

> `ANTHROPIC_API_KEY`는 서버 전용 환경변수입니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

---

## Vercel 배포

1. GitHub에 push
   ```bash
   git add .
   git commit -m "deploy"
   git push origin main
   ```

2. [Vercel](https://vercel.com) 로그인 → **Add New Project** → GitHub 레포 import

3. **Environment Variables** 탭에서 아래 3개 값 입력:
   | 키 | 값 |
   |----|-----|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `ANTHROPIC_API_KEY` | Anthropic API 키 |

4. **Deploy** 클릭

> **Note**: AI 챗봇 API(`/api/chat`)는 응답 시간이 10초를 초과할 수 있습니다.  
> Vercel Hobby 플랜(무료)은 Serverless Function 타임아웃이 10초이므로,  
> 안정적인 챗봇 사용을 위해 **Vercel Pro 플랜** 사용을 권장합니다.

---

## 주요 기능

| 페이지 | 기능 |
|--------|------|
| `/` (대시보드) | 요약 카드, 플랫폼별 도넛 차트, 월별 편수 추이, Top N 작품 랭킹, 요일별 바 차트 |
| `/reviews` | 리뷰 작성/수정/삭제, 별점 필터, 작품 검색 |
| AI 챗봇 (우측 패널) | 자연어로 결제/리뷰 데이터 조회, 작품 추천 |

## 화면 노출 제한

개인정보 보호를 위해 아래 데이터는 화면에 표시되지 않습니다:
- 결제 금액 (편수로 대체)
- 첫/마지막 구매 날짜 (생활 기간으로 대체)

AI 챗봇 서버는 이 제한 없이 모든 데이터를 분석하여 답변합니다.
