import { generateText } from "ai"

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const { text } = await generateText({
    model: "google/gemini-3-pro-preview",
    prompt: `Você é um especialista em educação do ensino fundamental brasileiro e em design de materiais didáticos.

Sua tarefa é aprimorar o seguinte pedido de atividade escolar para que a IA gráfica gere uma atividade pedagogicamente eficaz.

Pedido original: "${prompt}"

DIRETRIZES OBRIGATÓRIAS para o aprimoramento:

**Elementos Visuais e Estéticos:**
- Inclua ilustrações lúdicas para crianças
- Sugira ícones, mascotes ou personagens infantis quando apropriado
- Especifique um layout organizado e limpo, adequado para folha A4

**Contexto Cultural Brasileiro:**
- Use referências à cultura brasileira quando relevante, de forma diversa e sem esteriótipos
- Siga as diretrizes da BNCC (Base Nacional Comum Curricular) para o nível escolar
- Inclua nomes e contextos brasileiros nos exemplos e enunciados
- Respeite a diversidade cultural do Brasil

**Língua Portuguesa Brasileira:**
- Todo o texto DEVE estar em Português do Brasil (PT-BR)
- Use ortografia oficial conforme o Acordo Ortográfico
- Linguagem adequada à faixa etária da criança
- Enunciados claros e objetivos

**Estrutura Pedagógica:**
- Identifique e especifique a faixa etária/ano escolar apropriado
- Inclua espaços adequados para respostas (linhas, quadrados, lacunas)
- Adicione um título e instruções claras
- Considere diferentes níveis de dificuldade quando apropriado

**Referência BNCC (OBRIGATÓRIO):**
- A atividade DEVE incluir um rodapé ou caixa de destaque com a referência à BNCC
- Formato obrigatório: "BNCC: [Código] - [Habilidade]"
- Exemplo: "BNCC: EF01LP01 - Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página"
- Identifique a Competência Geral e a Habilidade Específica mais adequada ao conteúdo
- O código deve seguir o padrão oficial: EF[ano][componente][número] (ex: EF03MA01, EF02LP05)
- Componentes: LP (Língua Portuguesa), MA (Matemática), CI (Ciências), GE (Geografia), HI (História), AR (Arte), EF (Educação Física), ER (Ensino Religioso)

Retorne APENAS o prompt aprimorado, sem explicações. O prompt deve instruir a geração de uma atividade escolar brasileira, COM a referência BNCC visível na atividade.`,
    temperature: 42
  })

  return Response.json({ improvedPrompt: text })
}
