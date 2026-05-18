import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Termos de Uso | educando.app",
  description:
    "Termos e condições de uso do educando.app: cadastro, créditos, pagamento, propriedade intelectual e responsabilidades.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://educando.app/termos" },
}

const LAST_UPDATED = "27 de abril de 2026"

export default function TermosPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <article className="container mx-auto px-4 py-10 md:py-16">
          <div className="mx-auto max-w-3xl">
            <header className="mb-10">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Termos de Uso
              </h1>
              <p className="mt-3 text-sm text-gray-500">
                Última atualização: {LAST_UPDATED}
              </p>
            </header>

            <div className="space-y-8 leading-relaxed text-gray-800">
              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  1. Aceitação
                </h2>
                <p>
                  Ao criar uma conta, contratar um pacote de créditos ou utilizar qualquer
                  funcionalidade paga do educando.app, você declara que leu, compreendeu e
                  concorda integralmente com estes Termos de Uso e com a{" "}
                  <Link href="/privacidade" className="text-amber-700 underline">
                    Política de Privacidade
                  </Link>
                  . Se você não concorda, não utilize o serviço.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  2. Quem somos
                </h2>
                <p>
                  O educando.app é operado por <strong>Lucas Santos Rodrigues Ltda</strong>,
                  CNPJ <strong>65.101.183/0001-87</strong>, doravante &ldquo;educando.app&rdquo;.
                  Contato:{" "}
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
                  3. Idade mínima e cadastro
                </h2>
                <p>
                  O serviço destina-se a profissionais da educação e responsáveis maiores de{" "}
                  <strong>18 anos</strong>. Ao se cadastrar, você confirma que tem capacidade
                  civil plena para contratar.
                </p>
                <p className="mt-3">
                  O cadastro é feito exclusivamente via autenticação Google. Você é
                  responsável pelo sigilo e pela segurança da conta Google associada e por
                  todas as ações realizadas em sua conta no educando.app.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  4. O que oferecemos
                </h2>
                <p>O educando.app oferece duas camadas de serviço:</p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Diretório público</strong>: navegação e download de
                    atividades pedagógicas alinhadas à BNCC, sem necessidade de cadastro.
                  </li>
                  <li>
                    <strong>Geração paga</strong>: criação sob demanda de atividades
                    impressas e materiais de apoio personalizados, mediante consumo de
                    créditos previamente adquiridos.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  5. Créditos, pacotes e pagamento
                </h2>
                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  5.1. Pacotes disponíveis
                </h3>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong>Experimentar</strong> — R$ 14,90, 5 créditos.
                  </li>
                  <li>
                    <strong>Popular</strong> — R$ 39,90, 15 créditos.
                  </li>
                  <li>
                    <strong>Melhor valor</strong> — R$ 99,90, 40 créditos.
                  </li>
                </ul>
                <p className="mt-3">
                  Cada geração de atividade ou material de apoio consome <strong>1
                  crédito</strong>, debitado apenas após a entrega bem-sucedida do conteúdo.
                  Tentativas que falhem por erro técnico do educando.app não consomem
                  crédito.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  5.2. Pagamento
                </h3>
                <p>
                  Pagamentos são processados via <strong>Pix</strong>, intermediados pela
                  Stripe. A confirmação do pagamento e o crédito da carteira são automáticos,
                  geralmente em poucos minutos após o pagamento Pix ser registrado pelo seu
                  banco.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  5.3. Validade dos créditos
                </h3>
                <p>
                  Os créditos têm validade de <strong>12 meses</strong> contados da data da
                  compra do respectivo pacote. Créditos não utilizados nesse prazo expiram e
                  não geram direito a reembolso. Avisaremos por e-mail quando seus créditos
                  estiverem próximos do vencimento.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  5.4. Direito de arrependimento e reembolso
                </h3>
                <p>
                  Nos termos do art. 49 do Código de Defesa do Consumidor, você pode desistir
                  da compra em até <strong>7 (sete) dias corridos</strong> contados da
                  confirmação do pagamento, desde que <strong>nenhum crédito do pacote tenha
                  sido utilizado</strong>. Para solicitar o reembolso, escreva para{" "}
                  <a
                    href="mailto:rodrigueslucass@outlook.com.br"
                    className="text-amber-700 underline"
                  >
                    rodrigueslucass@outlook.com.br
                  </a>{" "}
                  informando o e-mail da conta e o identificador da transação. O valor será
                  devolvido pela mesma forma de pagamento, em até 14 dias.
                </p>
                <p className="mt-3">
                  Por se tratar de prestação de serviço digital de execução imediata, uma vez
                  consumido qualquer crédito do pacote, o serviço é considerado prestado e o
                  pacote não é mais reembolsável. Essa restrição não se aplica em caso de
                  falha do educando.app: se houver indisponibilidade prolongada ou defeito
                  comprovado que impeça o uso dos créditos, entre em contato e avaliaremos
                  reembolso ou recomposição caso a caso, observado o CDC.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  5.5. Recibos e nota fiscal
                </h3>
                <p>
                  Emitimos recibo automático por e-mail a cada compra. A emissão de Nota
                  Fiscal de Serviços, quando aplicável, segue a legislação municipal vigente.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  6. Geração de conteúdo e qualidade
                </h2>
                <p>
                  As atividades e materiais de apoio são produzidos com auxílio de modelos de
                  inteligência artificial e de fontes externas de pesquisa pedagógica.
                  Aplicamos curadoria automatizada e padrões de qualidade, mas o conteúdo
                  pode conter imprecisões, erros ortográficos ou inadequações ao seu contexto
                  específico de turma.
                </p>
                <p className="mt-3">
                  <strong>Você é responsável por revisar pedagogicamente o conteúdo</strong>{" "}
                  antes de utilizá-lo com seus alunos. O educando.app é uma ferramenta de
                  apoio à preparação de aulas, não substitui o juízo profissional do educador.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  7. Propriedade intelectual
                </h2>
                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  7.1. Conteúdo gerado por você
                </h3>
                <p>
                  Em relação às atividades e materiais gerados a partir dos seus créditos,
                  concedemos a você uma <strong>licença ampla, perpétua, mundial e
                  gratuita</strong> para uso pedagógico, incluindo: utilização em sala de
                  aula presencial e remota, fotocópia para distribuição aos alunos, inclusão
                  em planos de aula e materiais didáticos próprios. Essa licença{" "}
                  <strong>não autoriza</strong>: revenda do conteúdo, redistribuição em
                  plataformas pagas concorrentes, ou uso em produtos comerciais que tenham o
                  conteúdo do educando.app como objeto principal.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  7.2. Inclusão no diretório público
                </h3>
                <p>
                  Você concede ao educando.app uma <strong>licença não-exclusiva,
                  irrevogável e gratuita</strong> para incluir o conteúdo gerado, de forma
                  anonimizada (sem qualquer dado pessoal seu ou de terceiros), no diretório
                  público do educando.app, com finalidade de ampliar o acesso
                  pedagógico e fortalecer o projeto. A anonimização significa que o conteúdo
                  publicado não traz seu nome, e-mail ou outros identificadores.
                </p>

                <h3 className="mt-4 mb-2 font-heading font-semibold text-gray-900">
                  7.3. Marca e plataforma
                </h3>
                <p>
                  Os elementos da marca &ldquo;educando.app&rdquo; (nome, logotipo, identidade
                  visual, código-fonte da plataforma e textos editoriais) são de propriedade
                  exclusiva da educando.app e estão protegidos pela legislação de propriedade
                  intelectual. Nenhuma cláusula destes Termos transfere direitos sobre a
                  marca ou a plataforma a você.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  8. Conduta proibida
                </h2>
                <p>É vedado, sob pena de suspensão imediata e sem reembolso:</p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>compartilhar a sua conta com terceiros ou criar contas múltiplas;</li>
                  <li>
                    utilizar o serviço para gerar conteúdo ilegal, discriminatório, violento,
                    ofensivo, sexualmente explícito, que viole direitos de terceiros ou que
                    contrarie a ética pedagógica;
                  </li>
                  <li>
                    revender, sublicenciar ou distribuir comercialmente o conteúdo gerado em
                    desacordo com a cláusula 7.1;
                  </li>
                  <li>
                    tentar burlar limites técnicos, fazer engenharia reversa, scraping
                    massivo, ataques de negação de serviço ou qualquer atividade que
                    comprometa a segurança ou a disponibilidade do serviço;
                  </li>
                  <li>
                    usar o serviço para fins que violem a LGPD, o ECA ou qualquer legislação
                    aplicável.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  9. Suspensão e encerramento
                </h2>
                <p>
                  Podemos suspender ou encerrar a sua conta, com ou sem aviso prévio
                  proporcional à gravidade, em caso de descumprimento destes Termos, suspeita
                  fundada de fraude ou exigência legal. Em caso de encerramento por motivo
                  alheio à sua conduta (descontinuação do serviço, por exemplo), reembolsaremos
                  proporcionalmente os créditos não utilizados.
                </p>
                <p className="mt-3">
                  Você pode encerrar a sua conta a qualquer momento, escrevendo para{" "}
                  <a
                    href="mailto:rodrigueslucass@outlook.com.br"
                    className="text-amber-700 underline"
                  >
                    rodrigueslucass@outlook.com.br
                  </a>
                  . Créditos não utilizados não são reembolsados em caso de encerramento
                  voluntário, exceto na hipótese da cláusula 5.4.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  10. Disponibilidade e limitação de responsabilidade
                </h2>
                <p>
                  O educando.app é prestado &ldquo;como está&rdquo;, com nível de esforço
                  razoável de disponibilidade. Não garantimos uptime contínuo, ausência de
                  erros ou compatibilidade com qualquer ambiente específico. Manutenções
                  programadas serão comunicadas quando viável.
                </p>
                <p className="mt-3">
                  Na máxima extensão permitida em lei, a responsabilidade total da
                  educando.app perante você fica limitada ao valor pago por você nos últimos{" "}
                  <strong>12 meses</strong>. Não respondemos por danos indiretos, lucros
                  cessantes, perda de chance ou consequências do uso pedagógico do conteúdo
                  gerado, observada sempre a sua responsabilidade prevista na cláusula 6.
                </p>
                <p className="mt-3">
                  Esta limitação não afasta direitos do consumidor previstos no CDC quando
                  aplicáveis.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  11. Alterações destes Termos
                </h2>
                <p>
                  Podemos atualizar estes Termos sempre que necessário. Mudanças relevantes
                  serão comunicadas pelo e-mail cadastrado, com no mínimo 15 dias de
                  antecedência da entrada em vigor. O uso continuado do serviço após esse
                  prazo implica concordância com a nova versão. Se você não concordar com a
                  mudança, poderá encerrar a conta na forma da cláusula 9 e, observada a
                  cláusula 5.4, solicitar o reembolso dos créditos não utilizados.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                  12. Lei aplicável e foro
                </h2>
                <p>
                  Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica
                  eleito o foro do domicílio do consumidor para dirimir controvérsias, na
                  forma do CDC.
                </p>
              </section>

              <p className="pt-6 text-sm text-gray-500">
                Veja também a nossa{" "}
                <Link href="/privacidade" className="text-amber-700 underline">
                  Política de Privacidade
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
