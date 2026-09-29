# Plano de Implementação: Tela "Teste seu Agente" (Apenas Visual)

Entendido! Vamos construir a tela **"Teste seu Agente"** focando 100% na fidelidade visual e responsividade, mantendo todos os dados mockados nesta primeira etapa.

Aqui está o plano detalhado de como vou estruturar e implementar essa nova tela:

## 1. Criação do Arquivo e Navegação
- **Novo Arquivo:** Criarei um novo arquivo `teste-agente.html` copiando a estrutura base do painel (sidebar, topo, estilos globais) para manter o padrão visual idêntico ao `index.html`.
- **Atualização da Sidebar:** Vou adicionar o novo item "Teste seu Agente" com o ícone de robô (`ph-robot` ou similar) no menu lateral de **todas as páginas do painel** (`index.html`, `conversas.html`, `relatorios.html`, etc.), para que a navegação funcione perfeitamente.
- **Estado Ativo:** Na página `teste-agente.html`, esse item no menu receberá a classe `.active` para ficar com o fundo verde sólido e texto branco.

## 2. Topo e Aviso de Teste
- **Header da Página:** Adicionarei o título "Teste seu Agente" em destaque (h1) e o subtítulo explicativo logo abaixo em cinza.
- **Barra de Aviso (Trial):** Criarei uma `div` com fundo amarelo claro (`#FEF9C3` ou similar), ícone de relógio e o texto com a contagem de dias em negrito. Essa barra ocupará toda a largura útil do conteúdo.

## 3. Layout Principal (Grid/Flexbox)
- Usarei uma estrutura de `display: grid` ou `flex` com duas colunas principais (aprox. `60%` e `40%`), espaçadas com um `gap`.

### Coluna Esquerda: O Chat do Agente
- **Card:** Um card branco com bordas arredondadas e `display: flex; flex-direction: column` para que ocupe a altura toda e o campo de digitação fique preso ao rodapé.
- **Cabeçalho do Chat:** Ícone verde com o nome do assistente e status "online" com a bolinha verde, separados por uma linha suave (`border-bottom`).
- **Corpo das Mensagens:** 
  - Fundo cinza bem claro (`#F9FAFB` ou similar).
  - Pílula centralizada "Hoje".
  - Mensagens da IA (Esquerda): fundo branco, borda sutil, ícone do robô, timestamp.
  - Mensagens do Cliente (Direita): fundo verde claro (como no WhatsApp), texto escuro, timestamp + ícone de duplo check (`ph-check-square` ou `ph-checks`).
  - *Conteúdo exatamente como o mock solicitado.*
- **Input de Digitação:** Campo arredondado no rodapé, ícone de emoji à esquerda, texto de placeholder e botão verde de envio à direita.

### Coluna Direita: "Corrigir meu Agente"
- **Card Principal:** Card branco acompanhando a altura do chat.
- **Cabeçalho:** Ícone de engrenagem (`ph-gear`) + título e subtítulo.
- **Lista de Reportes:** Uma lista de 5 botões/linhas em `display: flex; justify-content: space-between`.
  - Cada item terá o ícone na cor específica (vermelho, azul, laranja, roxo, verde) com um fundinho claro da mesma cor.
  - Texto centralizado verticalmente.
  - Botão "Reportar" verde à direita.
- **Últimos Reportes (Footer do Card):** 
  - Título secundário com ícone de relógio.
  - Lista de mini-cards com fundo cinza claro para os reportes mockados, com data e setinha à direita.

## 4. Responsividade (Mobile)
- Em telas menores (mobile e tablets pequenos), a estrutura de colunas (60/40) se transformará em `flex-direction: column`.
- O "Chat" ficará no topo, ocupando 100% da largura, e o bloco "Corrigir meu Agente" ficará empilhado logo abaixo, garantindo que o layout não quebre ou fique apertado.
- Os paddings e margens serão ajustados para o padrão mobile já existente no `style.css`.

---

**O que acha do plano? Posso seguir com a criação e modificação dos arquivos?**
