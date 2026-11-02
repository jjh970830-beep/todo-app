-- 할 일 테이블
CREATE TABLE IF NOT EXISTS todos (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  done       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
