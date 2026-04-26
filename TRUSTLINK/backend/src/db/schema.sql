-- ============================================================
-- TNG VoiceTrust — PostgreSQL schema (Amazon RDS compatible)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  avatar_initials TEXT,
  avatar_color  TEXT,
  trust_score   INTEGER NOT NULL DEFAULT 50,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trust_requests (
  id            TEXT PRIMARY KEY,
  sender_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship  TEXT,
  description   TEXT,
  liability_cap NUMERIC(12,2) DEFAULT 5000,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | revoked
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trust_sender   ON trust_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_trust_receiver ON trust_requests(receiver_id);

CREATE TABLE IF NOT EXISTS loans (
  id            TEXT PRIMARY KEY,
  borrower_id   TEXT NOT NULL REFERENCES users(id),
  guarantor_id  TEXT REFERENCES users(id),
  amount        NUMERIC(12,2) NOT NULL,
  term_months   INTEGER NOT NULL,
  interest_rate NUMERIC(5,4) NOT NULL DEFAULT 0.068,
  monthly_payment NUMERIC(12,2),
  purpose       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | approved | active | repaid | defaulted | rejected
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  closed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_loans_borrower  ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_guarantor ON loans(guarantor_id);

CREATE TABLE IF NOT EXISTS repayments (
  id        TEXT PRIMARY KEY,
  loan_id   TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount    NUMERIC(12,2) NOT NULL,
  status    TEXT NOT NULL DEFAULT 'paid',
  paid_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_repay_loan ON repayments(loan_id);
