# Activity generator for teachers

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/lucassrodri08gmailcoms-projects/v0-activity-generator-for-teachers)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/kJKGPRCZs8n)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Configuração do Pagamento PIX

Este projeto usa o Mercado Pago para processar pagamentos PIX. Para configurar:

1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação no [Painel de Aplicações](https://www.mercadopago.com.br/developers/panel/app)
3. Copie seu Access Token (Credenciais de Produção ou Teste)
4. Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
```

### Funcionamento do Pagamento

- O usuário tem 3 atividades gratuitas por dia
- Após esgotar, pode pagar R$ 1,99 por atividade adicional via PIX
- O pagamento é processado completamente no client-side
- QR Code PIX é gerado e exibido no modal
- Verificação automática do status a cada 2.5 segundos
- Confirmação instantânea após pagamento aprovado

## Deployment

Your project is live at:

**[https://vercel.com/lucassrodri08gmailcoms-projects/v0-activity-generator-for-teachers](https://vercel.com/lucassrodri08gmailcoms-projects/v0-activity-generator-for-teachers)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/kJKGPRCZs8n](https://v0.app/chat/kJKGPRCZs8n)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
