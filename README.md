# educando.app

Diretório público de atividades pedagógicas alinhadas à BNCC + camada paga (créditos para geração + assinatura premium para downloads) para professores brasileiros.

## Funcionalidades

- **Diretório gratuito** — busca FTS (pt-BR, stemming, unaccent), insensível a acentos, match por tema/título/código BNCC. Sem cadastro.
- **Geração semanal automática (Vercel Cron)** — todo domingo, lê buscas recentes com poucos resultados e gera fichas via GPT-5.4-mini (com web_search nativo + reasoning xhigh) + gpt-image-2.
- **Autenticação** — Google OAuth via Supabase. Único provider.
- **Geração paga (créditos)** — usuário autenticado compra créditos via Pix (Stripe) e gera fichas A4 personalizadas sob demanda. 1 crédito = 1 geração.
- **Assinatura Premium (R$ 24,90/mês)** — desbloqueia Baixar / Imprimir / Salvar nas atividades do diretório. Stripe Subscriptions + Payment Element em cartão. Independente do sistema de créditos.
- **Histórico** — cada usuário acessa em `/minha-conta` suas atividades geradas, salvos premium, status da assinatura e movimentações de créditos.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router — `proxy.ts` em vez de `middleware.ts`) |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS v4 |
| Banco / Auth / Storage | Supabase |
| Pagamentos one-time | Stripe (conta Atlas / US) — Pix via PaymentIntent direto |
| Pagamentos recorrentes | Stripe Subscriptions — cartão via Payment Element |
| Geração de texto | OpenAI gpt-5.4-mini (Responses API + web_search + reasoning xhigh + structured outputs) |
| Geração de imagem | OpenAI gpt-image-2 (A4, 1024×1536, quality=high) |
| Proteção anti-bot | Cloudflare WAF |
| Deploy | Vercel |

## Desenvolvimento local

```bash
cp .env.example .env   # preencher todas as variáveis
npm install
npm run dev            # http://localhost:3000
npx tsc --noEmit       # verificação de tipos
```

Para testar o fluxo de pagamento, execute em paralelo:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
# copie o whsec_... para STRIPE_WEBHOOK_SECRET no .env e reinicie npm run dev
```

Em test mode:
- **Pix (créditos)**: use CPF `000.000.000-00` no checkout. Simule pagamento pelo Dashboard Stripe → PaymentIntent → "Simulate Pix payment".
- **Cartão (assinatura)**: use `4242 4242 4242 4242` com qualquer CVC e data futura.

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Variáveis obrigatórias:

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço — bypassa RLS; somente server-side |
| `OPENAI_API_KEY` | gpt-5.4-mini (spec + web_search) + gpt-image-2 (imagem) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `STRIPE_SECRET_KEY` | Stripe server-side |
| `STRIPE_WEBHOOK_SECRET` | Verificação de assinatura do webhook |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | ID do `Price` recorrente da assinatura (`price_...`). Gere com `scripts/setup-subscription-product.ts`. |
| `CRON_SECRET` | Protege `/api/cron/weekly-activities` |

## Banco de dados

Migrações em `supabase/migrations/` (até 014). Aplicar em ordem via Supabase Dashboard → SQL Editor ou MCP.

**Tabelas principais:**

| Tabela | Descrição |
|---|---|
| `activities` | Catálogo público + fichas geradas. `user_id` nullable — NULL = cron/curado. |
| `profiles` | Espelho de `auth.users` (email, full_name, avatar_url, stripe_customer_id). Auto-criado por trigger. |
| `payment_intents` | Um registro por checkout Pix. Status: `pending → paid\|failed\|canceled\|expired`. |
| `credit_ledger` | Append-only. `delta` assinado. Kinds: `purchase`, `consume`, `refund`, `expire`, `adjustment`. |
| `subscriptions` | Mirror local da assinatura Stripe. Status: enum Stripe completa. Índice único `WHERE status IN (...vivas...)` garante 1 sub ativa por user. |
| `saved_activities` | Bookmarks premium (`user_id`, `activity_id`). |
| `search_queries` | Telemetria de buscas. |
| `activity_clicks` | Cliques nos cards do diretório. |

**Funções SQL:**
- `current_credit_balance(uuid)` — soma deltas de créditos não-expirados.
- `is_subscription_active(uuid)` — true se o user tem sub `active/trialing/past_due` com `current_period_end > now()`.

**View:** `active_subscriptions` — atalho para subs que liberam acesso premium agora.

## Autenticação

- Google OAuth via Supabase. Único provider.
- `proxy.ts` (raiz) refresca sessão com `getClaims()` a cada request e aplica headers de segurança.
- Páginas protegidas chamam `getCurrentUser()` e fazem `redirect('/criar?login=1&next=...')` se necessário.
- `lib/supabase/server.ts` (service_role, sem cookies) é exclusivo de cron/admin/webhook e bypassa RLS — não usar em contexto autenticado de usuário.
- `lib/supabase/ssr-server.ts` e `ssr-client.ts` usam `@supabase/ssr` com cookies para autenticação no App Router.

**Setup Supabase para dev:**
- Authentication → Sign In / Providers → User Signups → "Allow new users to sign up": **ON**
- Authentication → URL Configuration → Redirect URLs: adicionar `http://localhost:3000/auth/callback`

## Pagamentos

### Créditos (Pix, one-time)

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

### Assinatura Premium (cartão, recorrente)

Modelo separado de créditos — desbloqueia ações nas atividades curated do diretório (Baixar, Imprimir, Salvar). Não interfere no fluxo de créditos.

- **Preço:** R$ 24,90/mês (BRL recorrente). Configurado em `lib/subscription-config.ts`.
- **Pagamento:** Stripe Subscriptions + Payment Element embutido em `<SubscriptionModal />` (não usa Stripe Checkout hospedado).
- **IOF:** cobrança internacional via Atlas US; banco do cliente pode adicionar ~6,38% no extrato. Disclaimer no modal de checkout.
- **Cancelamento:** `cancel_at_period_end=true` — usuário mantém acesso até `current_period_end`. Pode reativar a qualquer momento antes do período expirar.
- **API Dahlia (2026-04-22):** `current_period_start/end` migraram do objeto Subscription para `subscription.items[0]`. Helpers em `lib/stripe-subscription-utils.ts` lidam com isso.

**Setup inicial (one-off):** crie o Product/Price na Stripe rodando:

```bash
npx tsx scripts/setup-subscription-product.ts
```

O script é idempotente (procura por `metadata.app:'educando' AND metadata.plan:'premium-monthly'`). Cole a saída `STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...` no `.env` e no Vercel.

**Eventos de webhook necessários** (Dashboard Stripe → Developers → Webhooks):

- `payment_intent.succeeded` / `payment_intent.payment_failed` / `payment_intent.canceled` — créditos
- `customer.subscription.created` / `updated` / `deleted` / `paused` / `resumed` — assinatura
- `invoice.payment_succeeded` / `invoice.payment_failed` — falha de renovação

**Gate de UI:**

- `<SharedActivityClient mode="public">` (default em `/material/[slug]`) — botões Baixar/Imprimir/Salvar abrem `<PaywallModal />` se o user não é premium.
- `<SharedActivityClient mode="personal">` (em `/personalizado/[slug]`) — sem Crown, sem Salvar, sem Pinterest. Atividades próprias são livres.
- `<ProtectedImage />` aplica `.protected-image` (no-select, no-drag, no-contextmenu) somente em `/material/[slug]`.

## Pipeline de geração

Fonte compartilhada: `lib/generation.ts` (usada pelo cron E pelo endpoint pago `/api/gerar`).

**Etapas:**
1. GPT-5.4-mini (Responses API, `reasoning.effort: "xhigh"`, tool `web_search` nativo da OpenAI) — pesquisa, raciocina e gera o `ActivitySpec` (título, tema, descrições, códigos BNCC, prompt de imagem **em português**) via structured outputs JSON Schema strict. Regra suprema: 100% fiel ao pedido do usuário — não inventa tema, personagem ou ambientação cultural não solicitada.
2. gpt-image-2 — renderiza ficha A4 (1024×1536, quality=high, background=opaque) seguindo o `DESIGN_SYSTEM` (também em português)
3. Upload para Supabase Storage + INSERT em `activities` + débito no `credit_ledger`

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
- **Moderação** — GPT-5.4-mini valida cada busca aceita; falha = 401 + sem telemetria
- **Rate limit** — RPC `rate_limit_check` por IP com janela fixa (Supabase)
- **`proxy.ts`** — Permissions-Policy, HSTS, `Cache-Control: private, no-store` em todas as respostas
- **RLS** — `subscriptions` e `saved_activities` têm policies SELECT por `auth.uid()`; writes em `subscriptions` só via `service_role` (webhook)
- **WAF** — Cloudflare recomendado em produção

## Estrutura de modais (AuthGateProvider)

`AuthGateProvider` (em `app/layout.tsx`) injeta `isPremium` + `activityTotal` no contexto e renderiza 4 modais globais:

| Modal | Trigger | Propósito |
|---|---|---|
| `<LoginModal />` | `openLogin()` | Google OAuth via Supabase |
| `<CreditsModal />` | `openCredits()` | Compra de pacote de créditos via Pix |
| `<PaywallModal />` | `openPaywall({ action })` | Pitch da assinatura com foco na ação clicada (download/print/save) |
| `<SubscriptionModal />` | `openSubscription()` | Checkout do cartão com Payment Element |

`openPaywall()` redireciona automaticamente para `openLogin()` se o user não está autenticado.

## Integração Claude Code (opcional)

1. Crie um PAT em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
2. Adicione ao `.env`: `SUPABASE_ACCESS_TOKEN=seu-pat-aqui`.
3. Reabra o Claude Code — o MCP `supabase` do `.mcp.json` é iniciado automaticamente.

## Licença

Código proprietário. Todos os direitos reservados — Lucas Santos Rodrigues Ltda, CNPJ 65.101.183/0001-87.
