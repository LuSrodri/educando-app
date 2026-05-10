-- =========================================
-- educando.app - Row Level Security (RLS)
-- =========================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- após aplicar o schema.sql
-- =========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE activities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE browsers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- ACTIVITIES
-- Leitura: curated (user_id IS NULL) é pública; atividades privadas
-- (user_id IS NOT NULL) são visíveis apenas pelo próprio dono autenticado.
-- Escrita apenas via service_role (servidor Next.js).
-- ─────────────────────────────────────────
CREATE POLICY "activities: leitura pública"
  ON activities FOR SELECT
  USING (
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "activities: insert via service_role"
  ON activities FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "activities: update via service_role"
  ON activities FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "activities: delete via service_role"
  ON activities FOR DELETE
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- BROWSERS
-- Apenas service_role (servidor) pode acessar
-- ─────────────────────────────────────────
CREATE POLICY "browsers: acesso apenas service_role"
  ON browsers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- DAILY_USAGE
-- Apenas service_role (servidor) pode acessar
-- ─────────────────────────────────────────
CREATE POLICY "daily_usage: acesso apenas service_role"
  ON daily_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
