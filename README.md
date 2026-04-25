# educando.app

**O seu plano de aula a 1-click.** Diretório de atividades e materiais de apoio pedagógicos alinhados à Base Nacional Comum Curricular (BNCC).

## Sobre

O **educando.app** é um diretório inteligente para professores do ensino brasileiro. Pesquise por tema, palavra-chave ou código BNCC e abra em 1 click a atividade ou material de apoio ideal para a próxima aula. Quando o diretório não cobre a busca, um pipeline de enriquecimento externo busca, avalia e limpa materiais adicionais automaticamente.

## Funcionalidades

- **Busca inteligente** com full-text search (stemming pt-BR), fuzzy em título/tema, match exato em códigos BNCC. Insensível a acentos.
- **Enriquecimento externo sob demanda** — se a busca interna traz menos de 5 resultados, o sistema consulta Tavily, classifica cada candidato com GPT-5.4 nano (portrait + qualidade + tipo), limpa watermarks com `gpt-image-2` (images.edit) e persiste o material no diretório.
- **Geração semanal automática (Vercel Cron)** — todo domingo às 08:00 UTC, um cron job lê as buscas mais frequentes da semana com poucos resultados, pesquisa cada tema via **Tavily** + **Firecrawl**, gera a especificação completa via GPT-5.4 nano e produz a ficha impressa via `gpt-image-2`. Ver seção [Cron Jobs](#cron-jobs).
- **Metadados ricos** — cada material tem título, tema, descrição curta e longa, códigos BNCC aplicáveis e tipo (atividade | material de apoio).
- **Directório 100% público** — click em qualquer card abre o material em nova aba.
- **Telemetria** — toda busca e clique são registrados (para orientar melhorias futuras do diretório).
- **Segurança** — identidade fingerprint+IP com throttling de rotação, rate limit por fingerprint e Cloudflare Turnstile invisível protegendo o pipeline externo de ataques de carteira. Ver seção [Segurança](#segurança).
- **Sem login, sem pagamento, sem geração por prompt** — a versão ≥ 0.3 é puramente um diretório curado.

## Stack

- **Next.js 16** (App Router, Turbopack, Node runtime)
- **React 19** + **TypeScript** + **Tailwind CSS 4**
- **Supabase** — Postgres (FTS + trigram + unaccent) + Storage
- **OpenAI** GPT-5.4 nano com Structured Outputs (classificação + metadados) + `gpt-image-2` (limpeza de imagens externas via `images.edit`)
- **Tavily** (busca de imagens na web + pesquisa pedagógica para o cron semanal)
- **Firecrawl** (scraping de conteúdo técnico/BNCC para o cron semanal)
- **Cloudflare Turnstile** + WAF (proteção anti-bot)
- **FingerprintJS** open-source (visitorId no cliente)
- Deploy: **Vercel**

## Configuração

```bash
cp .env.example .env
```

### Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (server-only) |
| `OPENAI_API_KEY` | Backfill de metadados + classificação de candidatos externos + limpeza via `gpt-image-2` |
| `TAVILY_API_KEY` | Busca de imagens na web + pesquisa pedagógica para o cron semanal |
| `FIRECRAWL_API_KEY` | Scraping técnico (BNCC, conteúdo pedagógico) para o cron semanal |
| `CRON_SECRET` | Segredo que protege o endpoint do cron job (Vercel injeta como `Authorization: Bearer`) |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Site key do Turnstile (client) |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Secret key do Turnstile (server) |
| `IDENTITY_SALT` | Salt para hashear IP + fingerprint |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |
| `SUPABASE_ACCESS_TOKEN` | PAT do Supabase, usado apenas pelo MCP do Claude Code |

## Banco de dados

```bash
# O schema atual está em supabase/schema.sql (snapshot), e cada mudança
# incremental em supabase/migrations/<order>_<name>.sql.
# Aplicar no Supabase: via Dashboard → SQL Editor, ou via MCP (veja seção Claude Code).
```

Tabelas principais:

- `activities` — diretório. Inclui `search_vector tsvector` mantido por trigger + índices GIN (FTS, trigram em título/tema, array BNCC).
- `search_queries` — toda busca feita, com contagem de resultados e enriquecimento.
- `activity_clicks` — cliques nas cards da home.
- `saved_activities` — materiais salvos por professor (via fingerprint).
- `security_identities` — rastreamento de fingerprint + IP com campos de rotação.
- `rate_limit_counters` — contadores de janela fixa usados pela RPC `rate_limit_check`.
- `activities_backup_20260417` — snapshot preservado do banco antes da pivotagem.

## Desenvolvimento

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Scripts

- `scripts/start-supabase-mcp.mjs` — wrapper que injeta apenas `SUPABASE_ACCESS_TOKEN` do `.env` no MCP server (ver seção Claude Code).
- `scripts/backfill-directory-metadata.mjs` — reclassifica atividades existentes via GPT-5.4 nano para preencher `title/theme/bncc_codes/...`. Suporta `--limit=N --concurrency=N --dry-run`.
- `scripts/cleanup-orphan-storage.mjs` — remove do Storage imagens órfãs (que não têm mais linha em `activities`).

## Segurança

Quatro camadas cobrem abuso e protegem o pipeline de enriquecimento (Tavily + OpenAI), que gasta dinheiro por imagem nova:

1. **Moderação GPT-5.4-nano** — `lib/moderation.ts` classifica toda busca antes de ler o banco ou chamar APIs pagas. Rejeita `irrelevant`, `nonsense`, `injection`, `illegal`, `sexual`, `abuse`, `too_long`. Rejeição devolve `401` com o motivo e **não** grava nada nem consome nenhum recurso.
2. **Rate limit (por IP)** — RPC `public.rate_limit_check(bucket, key, limit, window_seconds)` com janela fixa. Key é o IP extraído por `lib/client-ip.ts` (atrás do Cloudflare usa `cf-connecting-ip`). Limites: busca 30/min, cliques 120/min, enrichment 10/hora.
3. **Cloudflare Turnstile invisível** — widget com `appearance: "interaction-only"` na seção de materiais; token vai no header `x-cf-turnstile-token`. Só é exigido quando a busca dispararia o enriquecimento externo — protege o pipeline pago sem estorvar UX normal.
4. **Cloudflare WAF** — configuração recomendada abaixo.

Identidade por usuário volta como `user_id` quando o plano pago + auth chegar (junto com a feature "Salvos").

### Keys do Turnstile em desenvolvimento

As chaves de produção requerem que o domínio esteja registrado no dashboard. Para rodar em `localhost`, adicione `localhost` / `127.0.0.1` aos Hostnames em [Cloudflare → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), **ou** use as test keys "sempre aprova":

```
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
CLOUDFLARE_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Se `CLOUDFLARE_TURNSTILE_SECRET_KEY` não estiver setado, a verificação é ignorada (modo dev). **Não faça isso em produção.**

### Cloudflare WAF

Recomendação para produção (domínio atrás do Cloudflare com proxy laranja ativo):

- **Managed Rules**: OWASP Core Ruleset em modo `Block`.
- **Rate Limiting Rules**: 500 req / 10 min por IP em `/api/*`.
- **Bot Fight Mode** ativado (free); `Super Bot Fight Mode` no plano Pro.
- **Security Level**: `Medium`.
- **Browser Integrity Check**: `On`.
- **IP Access Rules**: Challenge para acessos fora do Brasil, se o público-alvo for pt-BR.
- **Firewall Custom Rule**: `http.request.uri.path eq "/api/search" and http.request.method eq "GET" and cf.threat_score gt 20` → `Managed Challenge`.

`lib/identity.ts` extrai o IP correto de `cf-connecting-ip` quando atrás do Cloudflare.

## Cron Jobs

### Geração semanal de atividades (`/api/cron/weekly-activities`)

Configurado em `vercel.json` para rodar todo **domingo às 08:00 UTC** (`0 8 * * 0`).

**Pipeline (até 3 tópicos por execução, em paralelo):**

1. Lê de `search_queries` os termos mais buscados nos últimos 7 dias com `outcome='ok'` e `results_count < 5` (sub-cobertos), agregados por `normalized_query`.
2. Para cada termo, pula se já houver ≥ 2 atividades cobrindo o tema (idempotência contra eventos duplicados do Vercel).
3. **Tavily** busca referências pedagógicas + visuais alinhadas à BNCC e cultura brasileira.
4. **Firecrawl** faz scrape da URL pedagógica mais relevante (Nova Escola, MEC, etc.) para embasamento técnico.
5. **GPT-5.4 nano** sintetiza a pesquisa em uma `ActivitySpec` (title, theme, descriptions, bncc_codes, image_prompt) via Structured Outputs com schema strict.
6. **gpt-image-2** gera a ficha impressa A4 seguindo o design system embutido no prompt (cabeçalho com nome/escola/turma/professor/ano/data; figuras coloridas + layout monocromático; tipografia sans-serif neutra; rodapé com códigos BNCC; elementos da cultura brasileira).
7. Upload no Storage + INSERT em `activities` (source_provider='internal', quality_score=0.9).

**Configuração:**

- `maxDuration = 500` (Vercel Pro suporta até 800s).
- Autenticação: `Authorization: Bearer ${CRON_SECRET}` — gerar um valor aleatório com `openssl rand -hex 32` e configurar tanto no `.env` local quanto em Vercel → Project Settings → Environment Variables.
- Cron jobs do Vercel **podem disparar duplicado** — o coverage check garante idempotência.
- Cron jobs **não retentam em caso de falha** — monitorar via Vercel Logs.

**Teste manual após deploy:**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://educando.app/api/cron/weekly-activities
```

## Integração com Claude Code (opcional)

O projeto inclui um `.mcp.json` que inicia o MCP do Supabase automaticamente.

1. Crie um Personal Access Token em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
2. Adicione ao `.env`: `SUPABASE_ACCESS_TOKEN=seu-pat-aqui`.
3. Reabra o Claude Code e aprove o MCP `supabase` quando solicitado.

### Como o token chega ao MCP

`.mcp.json` chama `node scripts/start-supabase-mcp.mjs`, um wrapper cross-platform que:

1. Resolve a raiz do projeto via `import.meta.url` (funciona independente do cwd).
2. Lê **apenas** a linha `SUPABASE_ACCESS_TOKEN=` do `.env` (regex), exporta no ambiente e faz `spawn` do `@supabase/mcp-server-supabase`.
3. Nenhuma outra variável do `.env` vaza ao MCP; nenhum secret é hardcoded no `.mcp.json` (versionado).

Requisito: `node` no PATH (já é requisito do projeto). Para restringir a read-only, adicione `"--read-only"` à lista de args em `scripts/start-supabase-mcp.mjs`.
