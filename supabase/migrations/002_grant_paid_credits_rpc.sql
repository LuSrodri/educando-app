-- Migration: atomic grant_paid_credits function
-- Replaces the application-level read-compute-write in lib/paid-credits.ts
-- Uses INSERT ... ON CONFLICT DO UPDATE so the increment is a single atomic operation,
-- eliminating the race condition when two webhooks fire for the same payment.

CREATE OR REPLACE FUNCTION grant_paid_credits(p_browser_id TEXT, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  INSERT INTO paid_credits (browser_id, balance, total_bought)
  VALUES (p_browser_id, p_amount, p_amount)
  ON CONFLICT (browser_id) DO UPDATE
    SET balance      = paid_credits.balance + p_amount,
        total_bought = paid_credits.total_bought + p_amount,
        updated_at   = now()
  RETURNING balance INTO v_balance;

  RETURN v_balance;
END;
$$;
