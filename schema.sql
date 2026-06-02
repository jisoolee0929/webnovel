-- ============================================================
-- 웹소설 결제 트래커 — Supabase DB 스키마 (챗봇 포함 v2)
-- ============================================================
-- 적용 방법: Supabase 대시보드 > SQL Editor에 전체 붙여넣기 후 실행

-- ── 1. transactions (전체 결제 내역 원본) ────────────────────
CREATE TABLE transactions (
  id               BIGSERIAL PRIMARY KEY,
  transaction_id   TEXT NOT NULL UNIQUE,
  platform         TEXT NOT NULL,             -- '네이버 시리즈' | '카카오페이지' | '문피아'
  datetime         TEXT,
  date             DATE NOT NULL,
  year_month       TEXT NOT NULL,             -- 'YYYY-MM'
  year             INT NOT NULL,
  day_of_week      TEXT,                      -- '월'~'일'
  hour             INT,                       -- 0~23, 네이버 시리즈는 -1 (시간 정보 없음)
  title            TEXT NOT NULL,
  status           TEXT,                      -- '정상' | '구매' | '취소' | '대여기간 만료'
  amount_krw       INT NOT NULL DEFAULT 0,    -- 취소건은 음수
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. works (작품별 집계 요약) ──────────────────────────────
CREATE TABLE works (
  id               BIGSERIAL PRIMARY KEY,
  platform         TEXT NOT NULL,
  title            TEXT NOT NULL,
  purchase_count   INT DEFAULT 0,
  total_amount_krw INT DEFAULT 0,
  first_date       DATE,
  last_date        DATE,
  UNIQUE (platform, title)
);

-- ── 3. reviews (리뷰 & 평점) ─────────────────────────────────
CREATE TABLE reviews (
  id               BIGSERIAL PRIMARY KEY,
  platform         TEXT NOT NULL,
  title            TEXT NOT NULL,
  read_start_date  DATE,
  read_end_date    DATE,
  rating           NUMERIC(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
  short_review     TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. monthly_summary (월별 집계) ───────────────────────────
CREATE TABLE monthly_summary (
  id               BIGSERIAL PRIMARY KEY,
  year_month       TEXT NOT NULL UNIQUE,
  count            INT DEFAULT 0,
  work_count       INT DEFAULT 0,
  total_amount     INT DEFAULT 0,
  munpia_amount    INT DEFAULT 0,
  munpia_count     INT DEFAULT 0,
  kakao_amount     INT DEFAULT 0,
  kakao_count      INT DEFAULT 0,
  naver_amount     INT DEFAULT 0,
  naver_count      INT DEFAULT 0
);

-- ── 5. chat_messages (챗봇 대화 기록) ────────────────────────
-- Claude API가 context로 참고할 수 있도록 대화 이력을 저장
-- session_id: 브라우저 세션 단위로 대화 묶기 (UUID)
CREATE TABLE chat_messages (
  id               BIGSERIAL PRIMARY KEY,
  session_id       TEXT NOT NULL,             -- 대화 세션 단위 묶음
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 챗봇용 DB 함수 (API Route에서 호출)
-- Claude가 자연어 질문을 받아 이 함수들로 데이터를 조회함
-- ============================================================

-- 특정 작품 통계 조회
CREATE OR REPLACE FUNCTION get_work_stats(p_title TEXT)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'works',        (SELECT json_agg(w) FROM works w WHERE w.title ILIKE '%' || p_title || '%'),
    'total_spent',  (SELECT COALESCE(SUM(amount_krw), 0) FROM transactions
                     WHERE title ILIKE '%' || p_title || '%' AND amount_krw > 0),
    'total_count',  (SELECT COUNT(*) FROM transactions
                     WHERE title ILIKE '%' || p_title || '%' AND amount_krw > 0),
    'review',       (SELECT row_to_json(r) FROM reviews r
                     WHERE r.title ILIKE '%' || p_title || '%' LIMIT 1)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 소비 패턴 요약 조회 (챗봇 context용)
CREATE OR REPLACE FUNCTION get_spending_summary()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_amount',      (SELECT SUM(amount_krw) FROM transactions WHERE amount_krw > 0),
    'total_count',       (SELECT COUNT(*) FROM transactions WHERE amount_krw > 0),
    'total_works',       (SELECT COUNT(*) FROM works),
    'platform_breakdown',(SELECT json_object_agg(platform, total)
                          FROM (SELECT platform, SUM(amount_krw) AS total
                                FROM transactions WHERE amount_krw > 0
                                GROUP BY platform) sub),
    'top5_works',        (SELECT json_agg(sub) FROM
                          (SELECT title, platform, total_amount_krw
                           FROM works ORDER BY total_amount_krw DESC LIMIT 5) sub),
    'busiest_month',     (SELECT year_month FROM monthly_summary
                          ORDER BY total_amount DESC LIMIT 1),
    'busiest_day',       (SELECT day_of_week FROM
                          (SELECT day_of_week, SUM(amount_krw) AS total
                           FROM transactions WHERE amount_krw > 0
                           GROUP BY day_of_week ORDER BY total DESC LIMIT 1) sub),
    'period_start',      (SELECT MIN(date) FROM transactions),
    'period_end',        (SELECT MAX(date) FROM transactions)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 평점 높은 작품 조회 (추천용)
CREATE OR REPLACE FUNCTION get_top_rated_works(p_min_rating NUMERIC DEFAULT 4.0)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_agg(sub) INTO result
  FROM (
    SELECT r.title, r.platform, r.rating, r.short_review,
           w.total_amount_krw, w.purchase_count
    FROM reviews r
    LEFT JOIN works w ON w.title = r.title AND w.platform = r.platform
    WHERE r.rating >= p_min_rating
    ORDER BY r.rating DESC, w.total_amount_krw DESC
  ) sub;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_transactions_platform    ON transactions(platform);
CREATE INDEX idx_transactions_date        ON transactions(date);
CREATE INDEX idx_transactions_year_month  ON transactions(year_month);
CREATE INDEX idx_transactions_title       ON transactions(title);
CREATE INDEX idx_works_platform_title     ON works(platform, title);
CREATE INDEX idx_reviews_title            ON reviews(title);
CREATE INDEX idx_reviews_rating           ON reviews(rating);
CREATE INDEX idx_chat_messages_session    ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created    ON chat_messages(created_at);

-- ============================================================
-- updated_at 트리거 (reviews)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE works           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   ENABLE ROW LEVEL SECURITY;

-- 읽기: 전체 허용
CREATE POLICY "read_all" ON transactions    FOR SELECT USING (true);
CREATE POLICY "read_all" ON works           FOR SELECT USING (true);
CREATE POLICY "read_all" ON reviews         FOR SELECT USING (true);
CREATE POLICY "read_all" ON monthly_summary FOR SELECT USING (true);
CREATE POLICY "read_all" ON chat_messages   FOR SELECT USING (true);

-- ── 화면 노출 제한용 뷰 ───────────────────────────────────────
-- 클라이언트(Next.js)에서는 transactions 테이블 대신 이 뷰를 사용할 것
-- amount_krw, first_date, last_date 등 민감 컬럼 제외
CREATE OR REPLACE VIEW transactions_public AS
SELECT
  transaction_id, platform, year_month, year,
  day_of_week, hour, title, status
FROM transactions;

-- works 테이블도 금액·날짜 제외한 공개용 뷰
CREATE OR REPLACE VIEW works_public AS
SELECT platform, title, purchase_count
FROM works;

-- 쓰기: reviews + chat_messages만 허용
CREATE POLICY "insert_review" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "update_review" ON reviews FOR UPDATE USING (true);
CREATE POLICY "delete_review" ON reviews FOR DELETE USING (true);

CREATE POLICY "insert_chat"   ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_chat"   ON chat_messages FOR DELETE USING (true);
