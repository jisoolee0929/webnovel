# 웹소설 트래커 — 코드 수정 컨텍스트 (데이터 업데이트 반영)

## 이 문서의 목적

기존 `claude_code_prompt.md` 기준으로 개발이 진행된 상태에서,
데이터 정제 및 DB 구조 변경으로 인해 수정이 필요한 부분을 정리한 문서입니다.
**이 문서의 내용이 기존 프롬프트보다 우선 적용됩니다.**

---

## 1. works 테이블 구조 변경 (핵심)

기존 프롬프트의 works 테이블에 **3개 컬럼이 추가**됐습니다.

### 변경 전
```
platform, title, purchase_count, total_amount_krw, first_date, last_date
```

### 변경 후
```
platform, title, author, genre, rating,
purchase_count, total_amount_krw, first_date, last_date
```

| 추가 컬럼 | 타입 | 설명 |
|-----------|------|------|
| `author` | TEXT | 작가명 (크롤링 수집, 없으면 빈 문자열) |
| `genre` | TEXT | 장르 (크롤링 수집, 없으면 빈 문자열) |
| `rating` | NUMERIC(3,1) | 플랫폼 별점 (문피아는 NULL, 네이버/카카오만 있음) |

### 코드 수정 필요 위치

**Top 10 작품 테이블** — 장르, 작가 컬럼 추가 표시
```
컬럼: 순위 / 작품명 / 플랫폼 배지 / 장르 / 작가 / 구매 편수
(단, 금액은 여전히 표시 금지)
```

**작품 상세 모달** — 작가, 장르, 플랫폼 별점 추가 표시
```
- 작품명, 플랫폼 배지
- 작가 (author) — 있을 때만 표시
- 장르 (genre) — 있을 때만 표시
- 플랫폼 별점 (rating) — 있을 때만 표시 (문피아는 미표시)
- 구매 편수
- 월별 구매 편수 미니 바 차트
- 내가 남긴 리뷰 섹션
```

**works_public 뷰 사용** — 클라이언트에서 works 조회 시
```sql
-- 클라이언트에서는 반드시 works_public 뷰 사용
SELECT platform, title, author, genre, rating, purchase_count
FROM works_public
```

**챗봇 추천 기능 강화** — genre 컬럼 활용
```
"무협 장르 추천해줘" 같은 질문 시
works 테이블의 genre 컬럼 기반으로 필터링 후 추천 가능
```

---

## 2. 데이터 현황 업데이트

### works 테이블
- **기존**: 235개 작품
- **현재**: 204개 작품
- **변경 내용**:
  - 영상 콘텐츠 제거 (IZ*ONE CHU, 아이즈원츄 시리즈, 뭉쳐야 찬다2)
  - 제목 내 `[]`, `()` 표기 정리 (단행본, 한자 주석 등)
  - 중복 작품 통합 (같은 작품의 단행본/연재본 등)
  - 불필요 작품 삭제 (대니쉬 걸, 위대한 쇼맨, 사울의 아들, 어톤먼트, 레드스톰-왕의 귀환 등)
  - 플랫폼에서 내려간 작품 3개 → author/genre/rating 빈칸 처리
    (종말 생존 게임, 환생한 기갑기신 파일럿이 살아가는 법, 초인의 게임)

### 챗봇 System Prompt 수정
works 작품 수 변경으로 아래 문구를 수정해주세요.

```
// 기존
사용자는 2018년부터 2026년까지 ... 총 14,703건 ...

// 수정 후
사용자는 2018년부터 2026년까지 네이버 시리즈, 카카오페이지, 문피아에서
총 14,703건의 웹소설을 구매했어. 구매한 작품은 총 204개야.
장르 정보가 있는 작품은 works 테이블의 genre 컬럼을 참고해.
```

---

## 3. works_public 뷰와 works 테이블 사용 기준

Supabase에 두 가지가 존재합니다.

| 구분 | 이름 | 사용 위치 | 포함 컬럼 |
|------|------|-----------|-----------|
| 테이블 | `works` | 챗봇 API Route (서버) | 전체 컬럼 (금액 포함) |
| 뷰 | `works_public` | 클라이언트 컴포넌트 | platform, title, author, genre, rating, purchase_count |

클라이언트에서 `works` 테이블을 직접 조회하면 금액·날짜가 노출될 수 있으므로
**반드시 `works_public` 뷰를 사용**해주세요.

---

## 4. 플랫폼별 rating 처리 주의사항

```typescript
// rating 표시 시 null 체크 필수
{work.rating ? (
  <span>⭐ {work.rating}</span>
) : (
  <span className="text-gray-400">별점 없음</span>
)}

// 문피아는 rating이 항상 null
// 네이버 시리즈: 10점 만점
// 카카오페이지: 10점 만점
```

---

## 5. 챗봇 장르 기반 추천 쿼리 추가

기존 `/api/chat`의 질문 유형 분류에 장르 관련 분기를 추가해주세요.

```typescript
// 기존 분기에 추가
if (message.includes('장르') || message.includes('무협') ||
    message.includes('판타지') || message.includes('로맨스')) {
  // works 테이블에서 genre 필터링
  const { data } = await supabase
    .from('works')
    .select('title, platform, author, genre, rating, purchase_count')
    .ilike('genre', `%${extractedGenre}%`)
    .order('purchase_count', { ascending: false })
    .limit(10)
  dataContext = data
}
```

---

## 6. 변경 불필요한 부분

아래는 데이터 변경과 무관하므로 수정하지 않아도 됩니다.

- transactions 테이블 구조 및 쿼리
- monthly_summary 테이블 구조 및 쿼리
- reviews 테이블 구조 및 CRUD
- 챗봇 UI (사이드패널)
- 대화 이력 관리 로직
- 화면 노출 제한 정책 (금액 숨김)
- Vercel 배포 설정
- GitHub Actions (Supabase 자동 깨우기)

---

## 7. 수정 우선순위

```
1순위 (기능에 직접 영향)
  - works_public 뷰 사용으로 쿼리 교체
  - 작품 상세 모달에 author / genre / rating 추가

2순위 (UX 개선)
  - Top 10 테이블에 장르 / 작가 컬럼 추가
  - 챗봇 장르 기반 추천 분기 추가

3순위 (정확도)
  - 챗봇 System Prompt의 작품 수 문구 수정 (235개 → 204개)
```