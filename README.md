# educando.app

Diretório público de atividades pedagógicas alinhadas à BNCC + camada de geração paga por IA para professores brasileiros.

## Funcionalidades

- **Diretório gratuito** — busca FTS (pt-BR, stemming, unaccent), insensível a acentos, match por tema/título/código BNCC. Sem cadastro.
- **Enriquecimento externo** — quando a busca retorna < 5 resultados, o sistema consulta Tavily, classifica com GPT-5.4-nano e persiste o material no diretório.
- **Geração semanal automática (Vercel Cron)** — todo domingo, lê buscas recentes com poucos resultados e gera fichas via Tavily + Firecrawl + GPT-5.4-nano + gpt-image-2.
- **Autenticação** — Google OAuth via Supabase. Único provider.
- **Geração paga** — usuário autenticado compra créditos via Pix (Stripe) e gera fichas A4 personalizadas sob demanda. 1 crédito = 1 geração.
- **Histórico** — cada usuário acessa as fichas que gerou em `/minha-conta`.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router — `proxy.ts` em vez de `middleware.ts`) |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS v4 |
| Banco / Auth / Storage | Supabase |
| Pagamentos | Stripe (conta Atlas / US) — Pix via PaymentIntent direto |
| Geração de texto | OpenAI gpt-5.4-nano (structured outputs) |
| Geração de imagem | OpenAI gpt-image-2 (A4, 1024×1536, quality=high) |
| Pesquisa pedagógica | Tavily |
| Scraping educacional | Firecrawl |
| Proteção anti-bot | Cloudflare WAF |
| Deploy | Vercel |

## Desenvolvimento local

```bash
cp .env.example .env   # preencher todas as variáveis
npm install
npm run dev            # http://localhost:3000
npx tsc --noEmit       # verificação de tipos
```

Para testar o fluxo de pagamento Pix, execute em paralelo:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
# copie o whsec_... para STRIPE_WEBHOOK_SECRET no .env e reinicie npm run dev
```

Em test mode, use CPF `000.000.000-00` no checkout. Simule pagamento pelo Dashboard Stripe → PaymentIntent → "Simulate Pix payment".

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Variáveis obrigatórias:

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço — bypassa RLS; somente server-side |
| `OPENAI_API_KEY` | gpt-5.4-nano (spec) + gpt-image-2 (imagem) |
| `TAVILY_API_KEY` | Pesquisa pedagógica pré-geração |
| `FIRECRAWL_API_KEY` | Scraping de URLs educacionais |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `STRIPE_SECRET_KEY` | Stripe server-side |
| `STRIPE_WEBHOOK_SECRET` | Verificação de assinatura do webhook |
| `CRON_SECRET` | Protege `/api/cron/weekly-activities` |

## Banco de dados

Migrações em `supabase/migrations/` (010 aplicadas). Aplicar em ordem via Supabase Dashboard → SQL Editor ou MCP.

**Tabelas principais:**

| Tabela | Descrição |
|---|---|
| `activities` | Catálogo público + fichas geradas. `user_id` nullable — NULL = cron/curado. |
| `profiles` | Espelho de `auth.users` (email, full_name, avatar_url). Auto-criado por trigger. |
| `payment_intents` | Um registro por checkout Stripe. Status: `pending → paid\|failed\|canceled\|expired`. |
| `credit_ledger` | Append-only. `delta` assinado. Kinds: `purchase`, `consume`, `refund`, `expire`, `adjustment`. |
| `search_queries` | Telemetria de buscas (termo, resultados, outcome). |
| `activity_clicks` | Cliques nos cards do diretório. |

Função SQL: `current_credit_balance(uuid)` — soma deltas não-expirados. Disponível para `authenticated`.

## Autenticação

- Google OAuth via Supabase. Único provider.
- `proxy.ts` (raiz) refresca sessão com `getClaims()` a cada request e aplica CSP/headers de segurança.
- Cada page protegida chama `getCurrentUser()` e faz `redirect('/login?next=...')` se necessário.
- `lib/supabase/server.ts` (service_role, sem cookies) é exclusivo de cron/admin e bypassa RLS — não usar em contexts autenticados de usuário.
- `lib/supabase/ssr-server.ts` e `ssr-client.ts` usam `@supabase/ssr` com cookies para autenticação no App Router.

**Setup Supabase para dev:**
- Authentication → Sign In / Providers → User Signups → "Allow new users to sign up": **ON**
- Authentication → URL Configuration → Redirect URLs: adicionar `http://localhost:3000/auth/callback`

## Pagamentos (Stripe Atlas / Pix)

Conta Atlas (EUA) — settlement em USD, aceita Pix de clientes brasileiros.

- `amount_includes_iof: 'always'` — IOF 3,5% absorvido pela aplicação; cliente paga o preço exibido.
- CPF obrigatório em `payment_method_data.billing_details.tax_id` (requisito Banco Central para contas US).
- Pix expira em 30 minutos (`expires_after_seconds: 1800`).
- Webhook idempotente via unique partial index em `credit_ledger(payment_intent_id) WHERE kind = 'purchase'`.
- `components/pagamento/iof-disclosure.tsx` deve aparecer em `/comprar/[packCode]` e `/pagamento/[id]` — exigência contratual Stripe.

**Pacotes disponíveis** (fonte da verdade: `lib/credit-packs.ts`):

| Código | Label | Preço | Créditos |
|---|---|---|---|
| `experimentar` | Experimentar | R$ 14,90 | 5 |
| `popular` | Popular | R$ 39,90 | 15 |
| `melhor_valor` | Melhor valor | R$ 99,90 | 40 |

## Pipeline de geração

Fonte compartilhada: `lib/generation.ts` (usada pelo cron E pelo endpoint pago `/api/gerar`).

**Etapas:**
1. Tavily — pesquisa pedagógica com contexto BNCC + cultura brasileira
2. Firecrawl — scraping da URL educacional mais relevante (Nova Escola, MEC, etc.)
3. GPT-5.4-nano — gera `ActivitySpec` (título, tema, descrições, códigos BNCC, prompt de imagem) via JSON Schema strict
4. gpt-image-2 — renderiza ficha A4 (1024×1536, quality=high, background=opaque) seguindo o `DESIGN_SYSTEM`
5. Upload para Supabase Storage + INSERT em `activities` + débito no `credit_ledger`

O crédito é debitado **somente após sucesso completo**. Falha em qualquer etapa = sem débito.

## Cron semanal

Configurado em `vercel.json` — todo **domingo às 08:00 UTC**.

Lê buscas com poucos resultados da semana, gera até 3 atividades novas em paralelo. Idempotente: pula temas com ≥ 2 atividades existentes.

Teste manual:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://educando.app/api/cron/weekly-activities
```

## Segurança

- **quickReject** — checagem síncrona local (regex) que filtra queries óbvias antes de qualquer chamada externa
- **Moderação** — GPT-5.4-nano valida cada busca aceita; falha = 401 + sem telemetria
- **Rate limit** — RPC `rate_limit_check` por IP com janela fixa (Supabase)
- **`proxy.ts`** — Permissions-Policy, HSTS, `Cache-Control: private, no-store` em todas as respostas
- **WAF** — Cloudflare recomendado em produção

## Integração Claude Code (opcional)

1. Crie um PAT em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
2. Adicione ao `.env`: `SUPABASE_ACCESS_TOKEN=seu-pat-aqui`.
3. Reabra o Claude Code — o MCP `supabase` do `.mcp.json` é iniciado automaticamente.

## Licença

Código proprietário. Todos os direitos reservados — Lucas Santos Rodrigues Ltda, CNPJ 65.101.183/0001-87.
