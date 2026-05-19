-- 016: remove 'tavily' como source_provider válido.
-- Tavily foi retirado do pipeline; toda geração agora roda via gpt-5.4-mini com
-- web_search nativo da OpenAI. Nenhuma linha em produção tem source_provider =
-- 'tavily' (o código sempre inseriu 'internal'), então a troca de CHECK é segura.

ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_source_provider_check;

ALTER TABLE activities
  ADD CONSTRAINT activities_source_provider_check
  CHECK (source_provider IN ('internal'));
