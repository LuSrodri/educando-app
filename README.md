# educando.app

Gerador de atividades escolares com IA, alinhadas à BNCC e prontas para imprimir.

## Sobre

O **educando.app** é uma ferramenta para professores criarem atividades pedagógicas de forma rápida e prática. Digite um tema, escolha o nível escolar e receba uma atividade pronta para imprimir em segundos.

## Funcionalidades

- **Geração de atividades com IA** - Crie atividades a partir de qualquer tema
- **Alinhado à BNCC** - Atividades incluem referências à Base Nacional Comum Curricular
- **Níveis educacionais** - Alfabetização, Ensino Fundamental I (1º ao 5º ano) e II (6º ao 9º ano)
- **Tipos de material** - Atividade ao Aluno ou Material de Apoio ao Professor
- **Edição com IA** - Ajuste a atividade gerada com comandos simples
- **Download e impressão** - Atividades em alta qualidade, prontas para imprimir
- **Compartilhamento** - Compartilhe atividades via link
- **Histórico** - Acesse atividades geradas anteriormente
- **Comunidade** - Veja atividades compartilhadas por outros professores
- **Blog** - Conteúdo educacional para professores
- **Sem login** - Use diretamente no navegador

## Créditos

- 3 atividades gratuitas por quinzena (dias 1–15 e 16–fim do mês)

## Stack

- Next.js 16
- React 19
- Supabase
- Google GenAI
- Tailwind CSS
- Vercel

## Configuração

Copie o arquivo `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

### Variáveis de Ambiente

#### Supabase (Banco de dados e Storage)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (privada) |

Obtenha em: [Supabase Dashboard](https://supabase.com/dashboard)

#### Google Gemini AI (Geração de atividades)

| Variável | Descrição |
|----------|-----------|
| `GEMINI_API_KEY` | Chave da API do Google Gemini |

Obtenha em: [Google AI Studio](https://aistudio.google.com/app/apikey)

#### Aplicação

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Integração com Claude Code (opcional)

O projeto inclui um `.mcp.json` com o servidor MCP do Supabase para dar ao Claude Code acesso direto ao banco (schemas, queries, migrations).

Para ativar:

1. Crie um Personal Access Token em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. Adicione ao `.env`:
   ```
   SUPABASE_ACCESS_TOKEN=seu-pat-aqui
   ```
3. Reabra o Claude Code e aprove o MCP `supabase` quando solicitado

O servidor está configurado com acesso read-write. Para restringir a read-only, adicione `"--read-only"` aos `args` em `.mcp.json`.
