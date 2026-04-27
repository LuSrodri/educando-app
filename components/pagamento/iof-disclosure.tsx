/**
 * Texto exigido pela Stripe (Direct API + Pix em conta US): toda tela de
 * checkout precisa exibir esse aviso pro comprador brasileiro.
 * https://docs.stripe.com/payments/pix#iof-suggested-language-api-users
 */
export function IofDisclosure() {
  return (
    <p className="text-xs leading-relaxed text-gray-500">
      Esta é uma compra internacional e inclui a tarifa de 3,5% de IOF, já
      embutida no preço exibido. Ao prosseguir, você reconhece e aceita os{" "}
      <a
        href="https://www.ebanx.com/pt-br/legal/consumidores/brasil/termos-para-processar-pagamentos/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-700 underline"
      >
        termos e condições do Ebanx
      </a>
      . No extrato do seu banco aparecerá <strong>Ebanx</strong> como
      destinatário — está correto, é o nosso parceiro processador.
    </p>
  )
}
