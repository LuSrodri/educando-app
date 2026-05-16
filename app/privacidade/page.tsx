import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Política de Privacidade | educando.app",
  description:
    "Como o educando.app coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://educando.app/privacidade" },
}

const LAST_UPDATED = "27 de abril de 2026"

export default function PrivacidadePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <article className="container mx-auto px-4 py-10 md:py-16">
          <div className="mx-auto max-w-3xl">
            <header className="mb-10">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Política de Privacidade
              </h1>
              <p className="mt-3 text-sm text-gray-500">
                Última atualização: {LAST_UPDATED}
              </p>
            </header>

            <div className="space-y-8 leading-relaxed text-gray-800">
              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  1. Quem somos
                </h2>
                <p>
                  O educando.app é operado por <strong>Lucas Santos Rodrigues Ltda</strong>,
                  inscrita no CNPJ sob nº <strong>65.101.183/0001-87</strong>, doravante
                  denominada &ldquo;educando.app&rdquo;, &ldquo;nós&rdquo; ou &ldquo;controladora&rdquo;.
                  Esta política descreve como tratamos dados pessoais coletados por meio do
                  site <Link href="/" className="text-amber-700 underline">educando.app</Link>{" "}
                  e dos serviços associados, em conformidade com a Lei Geral de Proteção de
                  Dados (Lei nº 13.709/2018 — &ldquo;LGPD&rdquo;).
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  2. Dados que coletamos
                </h2>
                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  2.1. Visitante não autenticado
                </h3>
                <p>
                  Quando você navega no diretório público sem fazer login, nós coletamos
                  apenas dados técnicos mínimos necessários para entregar o serviço com
                  segurança: endereço IP, agente de usuário (browser e sistema operacional)
                  e logs de acesso. Esses dados são usados exclusivamente para limitar
                  abuso (rate limiting), proteger o serviço de ataques e gerar métricas
                  agregadas. Nós <strong>não usamos</strong> técnicas de fingerprinting,
                  rastreamento por hash de IP ou identificadores persistentes para visitantes
                  anônimos.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  2.2. Conta autenticada
                </h3>
                <p>
                  Ao entrar com sua conta Google, recebemos do Google: seu nome, endereço de
                  e-mail, foto de perfil e identificador único Google (sub). Não recebemos
                  sua senha. Esses dados são usados para criar e identificar a sua conta no
                  educando.app.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  2.3. Pagamento
                </h3>
                <p>
                  Pagamentos são processados pela <strong>Stripe Payments do Brasil Ltda</strong>{" "}
                  (CNPJ 38.452.180/0001-43). Nós <strong>não armazenamos</strong> dados
                  bancários, dados de cartão, chaves Pix ou qualquer informação financeira
                  sensível. Recebemos da Stripe apenas a confirmação de que um pagamento foi
                  concluído, o valor, o pacote adquirido e um identificador de transação para
                  fins de conciliação e emissão de recibo.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  2.4. Conteúdo gerado
                </h3>
                <p>
                  Quando você gera uma atividade ou material de apoio usando seus créditos,
                  armazenamos: o tema solicitado, parâmetros pedagógicos, o conteúdo final
                  gerado (texto e imagem) e o registro de débito de crédito. Esse conteúdo
                  fica vinculado à sua conta e disponível no seu histórico.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  3. Finalidades e bases legais
                </h2>
                <p>Tratamos seus dados para as seguintes finalidades, com as bases legais indicadas:</p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Prestar o serviço contratado</strong> (autenticação, geração de
                    atividades, histórico, débito de créditos): execução de contrato (LGPD,
                    art. 7º, V).
                  </li>
                  <li>
                    <strong>Processar pagamentos e emitir recibos</strong>: cumprimento de
                    obrigação legal e regulatória (art. 7º, II) e execução de contrato (art. 7º, V).
                  </li>
                  <li>
                    <strong>Proteger o serviço contra abuso e fraude</strong> (rate limiting,
                    detecção de bots, logs): legítimo interesse (art. 7º, IX).
                  </li>
                  <li>
                    <strong>Comunicações operacionais</strong> (confirmação de compra, avisos
                    de mudança de termos): execução de contrato (art. 7º, V).
                  </li>
                  <li>
                    <strong>Melhoria do serviço</strong> (métricas agregadas e anonimizadas):
                    legítimo interesse (art. 7º, IX).
                  </li>
                </ul>
                <p className="mt-3">
                  Não enviamos comunicações de marketing sem o seu consentimento prévio e
                  expresso.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  4. Com quem compartilhamos
                </h2>
                <p>
                  Para operar o serviço, contamos com sub-processadores cuidadosamente
                  selecionados. Eles tratam dados pessoais por nossa conta e sob nossas
                  instruções:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Supabase</strong> (banco de dados, autenticação e storage) —
                    Estados Unidos.
                  </li>
                  <li>
                    <strong>Vercel</strong> (hospedagem da aplicação) — Estados Unidos.
                  </li>
                  <li>
                    <strong>Cloudflare</strong> (CDN e proteção contra ataques) —
                    Estados Unidos.
                  </li>
                  <li>
                    <strong>Google LLC</strong> (autenticação OAuth) — Estados Unidos.
                  </li>
                  <li>
                    <strong>Stripe</strong> (processamento de pagamentos) — Brasil/EUA.
                  </li>
                  <li>
                    <strong>OpenAI, L.L.C.</strong> (geração de texto e imagem) — Estados Unidos.
                  </li>
                  <li>
                    <strong>Tavily</strong> (pesquisa web pedagógica) — Estados Unidos.
                  </li>
                  <li>
                    <strong>Firecrawl</strong> (extração de conteúdo de páginas educacionais) —
                    Estados Unidos.
                  </li>
                </ul>
                <p className="mt-3">
                  Nenhum desses sub-processadores é autorizado a usar seus dados para fins
                  próprios. Não vendemos, alugamos ou cedemos seus dados pessoais a
                  terceiros.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  5. Transferência internacional
                </h2>
                <p>
                  Como vários sub-processadores estão sediados no exterior, seus dados podem
                  ser transferidos para fora do Brasil. Essas transferências são feitas com
                  base nas hipóteses do art. 33 da LGPD, com sub-processadores que adotam
                  cláusulas contratuais e padrões de segurança equivalentes aos exigidos pela
                  legislação brasileira.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  6. Por quanto tempo guardamos
                </h2>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong>Conta e histórico</strong>: enquanto sua conta estiver ativa.
                  </li>
                  <li>
                    <strong>Atividades geradas</strong>: enquanto sua conta estiver ativa, ou
                    até você solicitar a exclusão.
                  </li>
                  <li>
                    <strong>Registros de pagamento</strong>: pelo prazo de 5 anos, conforme
                    obrigação fiscal e do Código de Defesa do Consumidor.
                  </li>
                  <li>
                    <strong>Logs técnicos</strong> (IP, requisições): até 90 dias.
                  </li>
                </ul>
                <p className="mt-3">
                  Após o encerramento da conta, os dados pessoais são excluídos no prazo de
                  até 30 dias, salvo aqueles que devemos preservar por obrigação legal.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  7. Seus direitos
                </h2>
                <p>Como titular de dados, você pode, a qualquer momento (LGPD, art. 18):</p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>confirmar a existência de tratamento dos seus dados;</li>
                  <li>acessar os seus dados;</li>
                  <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
                  <li>
                    solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;
                  </li>
                  <li>solicitar a portabilidade;</li>
                  <li>solicitar a exclusão dos dados tratados com base em consentimento;</li>
                  <li>obter informação sobre os sub-processadores;</li>
                  <li>revogar consentimentos;</li>
                  <li>opor-se a tratamentos baseados em legítimo interesse.</li>
                </ul>
                <p className="mt-3">
                  Para exercer qualquer desses direitos, escreva para{" "}
                  <a
                    href="mailto:rodrigueslucass@outlook.com.br"
                    className="text-amber-700 underline"
                  >
                    rodrigueslucass@outlook.com.br
                  </a>
                  . Responderemos em até 15 dias.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  8. Cookies
                </h2>
                <p>
                  Utilizamos apenas cookies estritamente necessários para o funcionamento do
                  serviço (manter você autenticado e prevenir abuso). Não usamos cookies de
                  publicidade ou de rastreamento de terceiros para fins de marketing.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  9. Crianças e adolescentes
                </h2>
                <p>
                  O educando.app destina-se a profissionais da educação maiores de 18 anos.
                  Não coletamos intencionalmente dados pessoais de crianças ou adolescentes.
                  O conteúdo pedagógico é produzido por adultos para uso em sala de aula com
                  alunos, sem coleta direta de dados desses alunos pelo educando.app.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  10. Segurança
                </h2>
                <p>
                  Adotamos medidas técnicas e administrativas para proteger seus dados,
                  incluindo: criptografia em trânsito (TLS), controle de acesso por linhas
                  (Row Level Security) no banco de dados, segregação de credenciais,
                  proteção contra abuso (Cloudflare) e auditoria periódica de
                  permissões. Apesar disso, nenhum sistema é 100% seguro; em caso de
                  incidente que possa gerar risco ou dano relevante, comunicaremos a ANPD e
                  os titulares afetados nos termos do art. 48 da LGPD.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  11. Encarregado (DPO) e contato
                </h2>
                <p>
                  Encarregado pelo Tratamento de Dados Pessoais: <strong>Lucas Santos
                  Rodrigues</strong>. Canal de contato:{" "}
                  <a
                    href="mailto:rodrigueslucass@outlook.com.br"
                    className="text-amber-700 underline"
                  >
                    rodrigueslucass@outlook.com.br
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  12. Atualizações desta política
                </h2>
                <p>
                  Podemos atualizar esta política periodicamente. Em caso de mudança
                  relevante, comunicaremos pelo e-mail cadastrado e atualizaremos a data
                  acima. O uso continuado do serviço após a notificação implica concordância
                  com a nova versão.
                </p>
              </section>

              <p className="pt-6 text-sm text-gray-500">
                Veja também os nossos{" "}
                <Link href="/termos" className="text-amber-700 underline">
                  Termos de Uso
                </Link>
                .
              </p>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
