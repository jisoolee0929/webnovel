# CHANGE_PLAN.md — 데이터 업데이트 반영 구현 계획

> 기준 문서: `CHANGE.md` (2026-06-15)
> 수정 불필요 항목(transactions, monthly_summary, reviews, 챗봇 UI, 배포 설정)은 제외.

---

## 전체 수정 파일 목록

| 파일 | 수정 사유 |
|------|-----------|
| `components/dashboard/TopWorksTable.tsx` | Work 타입 + 테이블에 장르·작가 컬럼 추가 |
| `components/WorkDetailModal.tsx` | WorkInfo 타입 + 모달에 작가·장르·플랫폼 별점 추가 |
| `app/api/chat/route.ts` | 장르 분기 추가, system prompt 작품 수 수정 |

---

## 1순위 — works_public 뷰 쿼리 교체 및 새 컬럼 활용

### Step 1-1. `TopWorksTable.tsx` — Work 타입 확장

**위치**: `components/dashboard/TopWorksTable.tsx`, line 25–29

**현재 코드**:
```typescript
interface Work {
  platform: string
  title: string
  purchase_count: number
}
```

**수정 후**:
```typescript
interface Work {
  platform: string
  title: string
  author: string
  genre: string
  purchase_count: number
}
```

**이유**: works_public 뷰에 author, genre 컬럼이 추가됐으므로 타입에도 반영 필요.

---

### Step 1-2. `TopWorksTable.tsx` — 테이블 헤더 컬럼 추가

**위치**: `<thead>` 안 `<tr>`, 플랫폼 열과 구매 편수 열 사이에 장르·작가 열 추가

**현재 헤더**:
```
순위 | 작품명 | 플랫폼 | 구매 편수
```

**수정 후 헤더**:
```
순위 | 작품명 | 플랫폼 | 장르 | 작가 | 구매 편수
```

추가할 `<th>` (플랫폼 `<th>` 바로 뒤):
```tsx
<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
  장르
</th>
<th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
  작가
</th>
```

---

### Step 1-3. `TopWorksTable.tsx` — 테이블 바디 셀 추가

**위치**: `<tbody>` 안 `<tr>`, 플랫폼 `<td>` 바로 뒤에 장르·작가 `<td>` 삽입

추가할 셀:
```tsx
<td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
  {work.genre || '—'}
</td>
<td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
  {work.author || '—'}
</td>
```

- 값이 빈 문자열이면 `'—'` 표시 (없는 데이터를 공백으로 두지 않음)

---

### Step 1-4. `app/page.tsx` — works_public 뷰 SELECT 컬럼 확장

**위치**: `app/page.tsx`의 works_public 쿼리 (대시보드 Server Component)

현재 쿼리가 `select('platform, title, purchase_count')` 형태라면 아래로 교체:

```typescript
.select('platform, title, author, genre, purchase_count')
```

- `total_amount_krw`는 정렬용으로만 필요하면 `.order('purchase_count', { ascending: false })`로 대체
- 금액 컬럼은 여전히 SELECT 하지 않음

**확인 필요**: `app/page.tsx` 파일에서 실제 쿼리 형태 확인 후 수정.

---

### Step 1-5. `WorkDetailModal.tsx` — WorkInfo 타입 확장

**위치**: `components/WorkDetailModal.tsx`, line 22

**현재**:
```typescript
type WorkInfo = { purchase_count: number }
```

**수정 후**:
```typescript
type WorkInfo = {
  purchase_count: number
  author: string
  genre: string
  rating: number | null
}
```

---

### Step 1-6. `WorkDetailModal.tsx` — works_public SELECT 컬럼 확장

**위치**: line 64–70, `supabase.from('works_public').select(...)` 부분

**현재**:
```typescript
supabase
  .from('works_public')
  .select('purchase_count')
  .eq('title', title)
  .eq('platform', platform)
  .maybeSingle(),
```

**수정 후**:
```typescript
supabase
  .from('works_public')
  .select('purchase_count, author, genre, rating')
  .eq('title', title)
  .eq('platform', platform)
  .maybeSingle(),
```

---

### Step 1-7. `WorkDetailModal.tsx` — 모달 헤더에 작가·장르·플랫폼 별점 표시

**위치**: 헤더 섹션 (`<h2>{title}</h2>` 바로 아래) 또는 구매 편수 섹션 위

조건부 렌더링 블록 추가 (work && 조건 안에 포함):

```tsx
{/* 메타 정보: 작가 / 장르 / 플랫폼 별점 */}
{work && (work.author || work.genre || work.rating !== null) && (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
    {work.author && (
      <span>✍️ {work.author}</span>
    )}
    {work.genre && (
      <span>📚 {work.genre}</span>
    )}
    {work.rating !== null && work.rating !== undefined && (
      <span>⭐ {work.rating} / 10</span>
    )}
  </div>
)}
```

**주의사항**:
- `rating`은 문피아의 경우 항상 `null` → 조건부 렌더링 필수
- 네이버 시리즈·카카오페이지는 10점 만점 → "/ 10" 단위 표기

---

## 2순위 — 챗봇 장르 기반 추천 분기 추가

### Step 2-1. `route.ts` — `classifyQuestion` 함수 장르 분기 추가

**위치**: `app/api/chat/route.ts`, line 26–30

**현재**:
```typescript
function classifyQuestion(msg: string): 'work_stats' | 'reviews' | 'recommendation' | 'summary' {
  if (/얼마|샀어|결제|구매/.test(msg)) return 'work_stats'
  if (/몇\s*점|평점|리뷰|별점|\d+점/.test(msg)) return 'reviews'
  if (/추천|좋아할|비슷한|취향/.test(msg)) return 'recommendation'
  return 'summary'
}
```

**수정 후** (반환 타입에 `'genre'` 추가):
```typescript
function classifyQuestion(
  msg: string,
): 'work_stats' | 'reviews' | 'recommendation' | 'genre' | 'summary' {
  if (/얼마|샀어|결제|구매/.test(msg)) return 'work_stats'
  if (/몇\s*점|평점|리뷰|별점|\d+점/.test(msg)) return 'reviews'
  if (/추천|좋아할|비슷한|취향/.test(msg)) return 'recommendation'
  if (/장르|무협|판타지|로맨스|현대|회귀|헌터|아포칼립스|게임|먹방|육아|학원/.test(msg))
    return 'genre'
  return 'summary'
}
```

**감지 장르 키워드**: `장르`, `무협`, `판타지`, `로맨스`, `현대`, `회귀`, `헌터`, `아포칼립스`, `게임`, `먹방`, `육아`, `학원` (실제 works 테이블 genre 컬럼 값에 맞게 조정 가능)

---

### Step 2-2. `route.ts` — `fetchContext` 함수에 'genre' 타입 처리 추가

**위치**: `app/api/chat/route.ts`, line 41–72, `fetchContext` 함수 내

`if (type === 'recommendation')` 블록 바로 뒤에 추가:

```typescript
if (type === 'genre') {
  // 메시지에서 장르 키워드 추출
  const genreKeywords = [
    '무협', '판타지', '로맨스', '현대', '회귀', '헌터',
    '아포칼립스', '게임', '먹방', '육아', '학원',
  ]
  const extractedGenre =
    genreKeywords.find((g) => message.includes(g)) ?? ''

  const query = supabase
    .from('works')
    .select('title, platform, author, genre, rating, purchase_count')
    .order('purchase_count', { ascending: false })
    .limit(10)

  if (extractedGenre) {
    query.ilike('genre', `%${extractedGenre}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
```

**주의**: `fetchContext`의 `message` 파라미터가 필요하므로 함수 시그니처 확인:
- 현재 `fetchContext(message: string, type: string)` → 이미 `message`가 있으므로 그대로 사용 가능

---

## 3순위 — 챗봇 System Prompt 작품 수 문구 수정

### Step 3-1. `route.ts` — STATIC_SYSTEM 상수 수정

**위치**: `app/api/chat/route.ts`, line 14–24, `STATIC_SYSTEM` 상수

**현재**:
```
사용자는 2018년부터 2026년까지 네이버 시리즈, 카카오페이지, 문피아에서
총 14,703건, 약 146만원 어치의 웹소설을 구매했어.
```

**수정 후**:
```
사용자는 2018년부터 2026년까지 네이버 시리즈, 카카오페이지, 문피아에서
총 14,703건의 웹소설을 구매했어. 구매한 작품은 총 204개야.
장르 정보가 있는 작품은 works 테이블의 genre 컬럼을 참고해.
```

**변경 이유**:
- 작품 수: 235개 → 204개 (영상 콘텐츠 제거, 중복 통합 등)
- "약 146만원" 문구 제거 (금액 노출 제한 정책 일관성)
- 장르 추천 기능 추가에 따른 안내 문구 추가

---

## 수정 순서 요약

```
[1순위] works 새 컬럼 반영
  Step 1-1  TopWorksTable.tsx — Work 타입에 author, genre 추가
  Step 1-2  TopWorksTable.tsx — 테이블 헤더에 장르·작가 th 추가
  Step 1-3  TopWorksTable.tsx — 테이블 바디에 장르·작가 td 추가
  Step 1-4  app/page.tsx — works_public SELECT에 author, genre 추가
  Step 1-5  WorkDetailModal.tsx — WorkInfo 타입에 author, genre, rating 추가
  Step 1-6  WorkDetailModal.tsx — SELECT 쿼리에 author, genre, rating 추가
  Step 1-7  WorkDetailModal.tsx — 모달 UI에 작가·장르·별점 표시 블록 추가

[2순위] 챗봇 장르 추천
  Step 2-1  route.ts — classifyQuestion 반환 타입 및 'genre' 분기 추가
  Step 2-2  route.ts — fetchContext에 'genre' 처리 블록 추가

[3순위] 챗봇 System Prompt
  Step 3-1  route.ts — STATIC_SYSTEM 작품 수 및 장르 안내 문구 수정
```

---

## 검증 체크리스트

- [ ] `npm run build` TypeScript 오류 없음
- [ ] TopWorksTable: 장르·작가 열이 빈 값일 때 `—` 표시 확인
- [ ] WorkDetailModal: 문피아 작품 클릭 시 rating 미표시 확인
- [ ] WorkDetailModal: author/genre 없는 작품 클릭 시 해당 줄 미표시 확인
- [ ] 챗봇 "무협 추천해줘" 입력 시 genre 분기 진입 확인
- [ ] 챗봇 System Prompt에 "204개" 문구 반영 확인
- [ ] 클라이언트에서 `works` 테이블 직접 조회 없음 (반드시 `works_public` 사용)
