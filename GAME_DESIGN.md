# MEGACOLISEUM — Visão e Design Macro

> **Status:** visão macro v0.1
> **Última consolidação:** 2026-07-12
> **Fonte criativa:** Wall
> **Escopo:** intenção do produto, loops principais, autoridade do Mestre, exploração e batalha
> **Regra:** fatos decididos, propostas técnicas e decisões abertas são explicitamente separados neste documento.

---

## 1. Fantasia Central

MEGACOLISEUM é um mundo online persistente criado para permitir que um grupo de amigos viva uma campanha de RPG mesmo quando organizar sessões frequentes é difícil.

O jogo possui duas cadências complementares:

1. **Mundo sempre disponível:** jogadores exploram, enfrentam encontros, farmam, colecionam heróis e armas, usam serviços de NPC, negociam, melhoram equipamentos e evoluem entre campanhas.
2. **Campanha dirigida pelo Mestre:** quando Wall entra como Mestre/Narrador, ele conduz conteúdo autoral, reúne ou transporta jogadores, controla o espaço da sessão, apresenta narrativa, cria encontros e entrega recompensas especiais.

A campanha pode ficar meses sem um novo capítulo. Nesse intervalo, o mundo continua jogável e a progressão continua significativa.

### Frase norteadora

> Um mundo persistente para viver, evoluir e colecionar; uma mesa de RPG online quando o Mestre chega.

---

## 2. Pilares do Produto

### 2.1 Mundo persistente

- Cidades e regiões conectadas, com faixas crescentes de dificuldade.
- Zonas seguras, rotas de exploração, áreas de farm e encontros.
- NPCs com serviços permanentes: loja, venda, upgrade, crafting/refino, cura, armazenamento e outros serviços clássicos.
- Quests públicas e repetíveis que não dependem do Mestre.
- Economia e progressão continuam ativas entre capítulos da campanha.

### 2.2 Campanha viva do Mestre

- Wall prepara capítulos quando desejar, sem obrigação de frequência fixa.
- O Mestre pode reunir e transportar participantes para uma área de campanha.
- A área pode ser isolada ou bloqueada durante a sessão.
- O Mestre pode narrar, controlar NPCs, disparar objetivos, criar encontros, alterar estados do cenário e conceder recompensas.
- Ao terminar o capítulo, os jogadores retornam ao mundo persistente com as consequências e recompensas conquistadas.

### 2.3 Coleção com identidade

- Cada conta possui uma coleção de heróis.
- O jogador mantém um roster principal de até seis heróis disponíveis para batalha.
- Armas são itens colecionáveis com progressão duradoura e potencialmente infinita.
- A progressão da arma preserva investimento mesmo quando o jogador troca de herói.
- Heróis aposentados não desaparecem: seus legados permanecem no Livro de Memórias.

### 2.4 Batalha tática legível

- O encontro interrompe a exploração e abre um lobby de batalha.
- O jogador leva até seis heróis e escolhe três titulares.
- Cada lado possui uma grade de nove espaços, organizada em três faixas: frente, meio e trás.
- Cada jogador controla no máximo três heróis ativos ao mesmo tempo.
- As outras casas podem receber clones, tokens, barreiras e invocações criados por habilidades ou itens.
- A batalha alterna **Preparação** e **Resolução**.
- A Preparação permite planejar ações, gastar Mana, reposicionar e substituir heróis.
- A Resolução executa as ações confirmadas segundo regras determinísticas de prioridade/velocidade.

### 2.5 Progressão longa sem apagar o passado

- O jogo deve suportar anos de evolução sem invalidar completamente conquistas anteriores.
- Conteúdo de campanha entrega recompensas memoráveis, mas o mundo comum continua relevante.
- Poder numérico, domínio, coleção e opções táticas devem evoluir sem depender de resets sazonais destrutivos.

---

## 3. Macroloops

### 3.1 Loop permanente do jogador

```text
Entrar → escolher destino → explorar → encontrar ameaça/quest
      → batalhar → receber XP/itens/moeda/heróis
      → vender/equipar/aprimorar/organizar coleção
      → acessar região mais difícil ou repetir o ciclo
```

### 3.2 Loop de campanha

```text
Mestre publica sessão/capítulo
  → participantes são reunidos
  → Mestre transporta e isola o grupo
  → exploração, narrativa, decisões e encontros autorais
  → clímax/recompensas/consequências persistentes
  → liberação dos jogadores para o mundo permanente
  → preparação do próximo capítulo, sem prazo obrigatório
```

### 3.3 Loop de coleção

```text
Descobrir herói/arma → adquirir → testar composição
  → fortalecer vínculo, habilidade e arma
  → especializar estratégia → registrar legado
  → buscar novas combinações sem apagar a história anterior
```

---

## 4. Entrada e Onboarding

### Fluxo confirmado

1. O jogador acessa um link.
2. Cria ou acessa sua conta.
3. Recebe seu primeiro herói.
4. Entra na cidade inicial e começa a explorar o mundo.

### Caminho dourado de validação

O protótipo mantém a conta de desenvolvimento `zero` para validar continuidade entre versões. Em desenvolvimento, ela usa as credenciais `zero` / `zero`, possui personagem principal e cinco heróis estáveis. Quando PostgreSQL está disponível, a fixture é criada ou reparada na base; sem banco, os mesmos IDs e dados são recriados no fallback local, mas progresso entre reinicializações exige PostgreSQL.

```text
Login zero → Lobby → Perfil/personagem → Entrar no Mundo
  → mover por teclado, mouse, joystick virtual ou controle físico
  → falar com Instrutor Kael → aceitar duelo PvE
  → lobby com 5 heróis → selecionar 3 → confirmar
  → transição de encontro → Fase de Preparação
```

O menu abre com `Esc`; tanto o cabeçalho do mundo quanto o menu oferecem retorno explícito ao lobby. A conta permanece autenticada ao alternar livremente entre lobby e mundo.

### Variações previstas para o primeiro herói

- **Entrada comum:** herói inicial aleatório, apresentado como uma descoberta misteriosa inspirada no sentimento de receber um primeiro Pokémon.
- **Código de convite:** permite que Wall conceda um herói especial ou predefinido para uma pessoa.

### Decisão ainda aberta

Definir se o código de convite substitui o sorteio, escolhe dentro de um pool exclusivo ou apenas adiciona um bônus ao primeiro herói.

---

## 5. Exploração do Mundo

### Decisão de produto

A exploração deverá migrar do overworld isométrico 2D/PixiJS atual para um ambiente **3D**, com câmera e movimentação inspiradas na leitura de exploração de The Legend of Dragoon, adaptadas para navegador e para a identidade do MEGACOLISEUM.

### Direção técnica proposta

- React continua responsável pela aplicação, menus e HUD.
- React Three Fiber é o candidato principal para o renderer 3D por integrar-se à base React existente.
- Enquanto o projeto permanecer em React 18, a combinação compatível é `@react-three/fiber` 8 e, se adotado, `@react-three/rapier` 1. R3F 9/Rapier 2 pressupõem React 19; nenhuma dependência será instalada antes da vertical slice ser formalmente iniciada.
- Colyseus continua como autoridade de estado multiplayer.
- A simulação de mundo não deve morar nos componentes visuais 3D.
- Assets de produção devem convergir para GLB/glTF, com convenções de escala, pivô, colisão e LOD.
- Física/colisão pode usar Rapier quando a prova de conceito demonstrar necessidade.

### Estratégia de migração

1. Extrair do `GameCanvas.tsx` os contratos de input, rede, entidades, interação e HUD.
2. Criar uma pequena vertical slice 3D separada: personagem, câmera, chão, colisão, um NPC e outro jogador sincronizado.
3. Validar desempenho, leitura visual e sensação de movimento em hardware alvo.
4. Conectar o renderer 3D aos mesmos contratos Colyseus.
5. Migrar uma zona completa antes de retirar o overworld PixiJS.

### Limite importante

A decisão 3D refere-se inicialmente à **exploração**. A batalha pode permanecer 2.5D/ilustrada, com personagens em planos e efeitos animados, até existir motivo de produto para reconstruí-la em 3D.

---

## 6. Lobby Social e Modos de Jogo

Depois do login, o jogador entra em um lobby que também existe como lugar social. Jogadores conectados podem se ver, interagir, organizar grupos e escolher qual mundo/modo acessar.

### Modos iniciais

1. **Mundo RPG:** exploração persistente, PvE, farming, quests públicas e campanhas cooperativas do Mestre.
2. **Duelo:** confronto competitivo direto entre jogadores usando seus heróis, armas e coleção do mesmo universo.
3. **Brawl:** competição para oito jogadores inspirada em Battlegrounds/autochess. A cada rodada, o servidor sorteia/emparelha adversários, todos preparam seus tabuleiros simultaneamente, as batalhas são resolvidas e os sobreviventes retornam à Preparação até restar um vencedor.

### Modos futuros

Mario Party, Tetris, Tower Defense e outros modos clássicos poderão existir dentro do mesmo servidor/universo. Eles reutilizam conta, identidade, coleção e recompensas compatíveis, mas possuem runtimes e regras próprias.

### Regra estrutural

O lobby, a conta e a coleção formam a plataforma compartilhada. Cada modo deve declarar quais itens/heróis usa e quais recompensas devolve ao metajogo, sem acoplar suas regras internas ao mundo RPG.

### Arquitetura do hub implementada

O hub usa uma hierarquia de jogo competitivo moderna: identidade e moedas no topo, personagem favorito como foco cinematográfico, ação **Jogar** dominante e atalhos persistentes para Heróis, Eventos e Loja. Perfil, inventário, amigos, missões, memórias, histórico, ferramentas do Mestre e ajustes ficam numa central secundária para reduzir ruído na tela inicial.

As salas personalizadas usam a presença do `GameRoom`: o líder escolhe Mundo RPG, Treino PvE ou Duelo, define até 3 participantes para exploração/coop ou até 6 para duelo, recebe um código e inicia o transporte dos membros conectados. Esse registro é temporário em memória; persistência, privacidade, expulsão e reconexão permanecem evolução posterior.

A Loja e os Eventos entregam, por enquanto, a arquitetura visual e a navegação. Não simulam compras nem recompensas: catálogo transacional e progresso persistido dependem de contratos próprios no servidor.

Usar os mesmos colecionáveis não define automaticamente o balanceamento competitivo. Duelo e Brawl precisarão declarar se usam poder integral, faixas de poder, matchmaking por coleção ou algum tipo de normalização.

---

## 7. Encontros e Lobby de Batalha

### Gatilho

Durante a exploração, um encontro pode ser iniciado por colisão, zona de risco, inimigo visível, quest, evento do Mestre ou outro gatilho autorizado pelo servidor.

### Transição

```text
Exploração → encontro validado pelo servidor → transição
  → lobby de batalha → escolha de 3 titulares entre até 6
  → posicionamento inicial → confirmação → Preparação do turno 1
```

### Lobby de batalha

- Exibe os seis heróis disponíveis, condições do encontro e formação inimiga conhecida.
- Permite escolher três titulares.
- Permite posicionar os titulares em casas válidas da grade 3×3.
- Pode permitir escolher runa, consumíveis ou modificadores pré-batalha, quando esses sistemas estiverem definidos.
- Ao confirmar, a formação inicial torna-se uma ordem enviada ao servidor.
- O duelo de treinamento usa cinco candidatos por lado, três titulares e seleção por mouse, teclas `1–5`, `Q/E`, `Espaço`, `Enter` ou controle físico.

### Campanha cooperativa

- Cada jogador entra inicialmente com **um herói**, usando o herói marcado como favorito por padrão.
- O jogador pode alterar essa escolha no lobby pré-batalha antes de confirmar.
- A party cooperativa comporta **até três jogadores**.
- Os participantes da mesma equipe compartilham **uma única grade 3×3**; cada jogador ocupa uma casa com seu herói e duas entidades aliadas nunca podem ocupar a mesma casa.
- Cada participante decide a ação do próprio herói durante a Preparação.
- A fase termina quando todos os participantes conectados confirmam ou quando o cronômetro do servidor chega ao fim; somente então começa a Resolução.
- Uma substituição usa Mana e consome a ação daquele personagem no turno, seguindo a leitura estratégica de troca de Pokémon.
- A composição do grupo surge da combinação dos heróis escolhidos pelos participantes, não de um único jogador controlando seis heróis.

### PvP em equipes e PvPvE

- O mesmo contrato comporta confrontos **1×1, 2×2 e 3×3**.
- Cada jogador controla um herói e compartilha a grade 3×3 com os aliados da própria equipe.
- As regras de casa exclusiva, confirmação simultânea, Mana e resolução autoritativa são as mesmas do cooperativo.
- Encontros PvPvE podem acrescentar entidades controladas pelo servidor sem mudar a propriedade das ações dos jogadores.

### Brawl

- O Brawl reúne oito jogadores e preserva o ciclo Preparação → Resolução → Preparação.
- Diferentemente do cooperativo e do PvP em equipes, **cada participante possui seu tabuleiro 3×3 completo**.
- O pareamento por rodada, vida, eliminação e desempates do Brawl continuam como contrato futuro; a fundação de modo não significa que o modo completo já esteja jogável.

---

## 8. Campo de Batalha

### Grade

Cada lado possui nove casas:

```text
TRÁS    [ 1 ] [ 2 ] [ 3 ]
MEIO    [ 4 ] [ 5 ] [ 6 ]
FRENTE  [ 7 ] [ 8 ] [ 9 ]
```

A orientação visual pode ser espelhada entre equipes, mas os identificadores lógicos das casas devem permanecer estáveis.

### Ocupação

- No solo, três heróis começam em campo e os três heróis restantes ficam na reserva.
- No cooperativo e no PvP em equipes, cada jogador começa com um herói e a equipe pode ter até três heróis de jogadores ativos na grade compartilhada.
- Cada casa comporta no máximo uma entidade, independentemente de ela ser herói, clone, token, barreira ou invocação.
- Heróis da reserva podem substituir heróis ativos durante a Preparação mediante custo de Mana e condição válidos.
- Casas sem herói podem ser ocupadas por clones, tokens, barreiras e invocações criados por habilidades ou itens.
- Unidades auxiliares não aumentam o limite de três heróis, mas podem preencher o tabuleiro e criar estratégias de ocupação.

### Prioridade e perfuração

- Ataques comuns priorizam o alvo válido mais à frente.
- Unidades e barreiras à frente protegem o conteúdo posicionado atrás.
- **Sem perfuração:** atinge somente o alvo primário válido da faixa prioritária.
- **Perfurante 1:** atravessa o alvo primário e alcança a próxima entidade atrás na mesma linha.
- **Perfurante 2:** continua a trajetória e alcança até três entidades na mesma linha.
- Alcance de perfuração não utilizado é perdido; o efeito não salta para outra linha.
- Habilidades podem declarar exceções, alvo direto, área, linha, coluna ou regras próprias.

A distribuição entre profundidade, linhas, lacunas e perfuração está fechada para a v1 em `BATTLE_SYSTEM_SPEC.md`: frente protege globalmente ataques básicos; o jogador escolhe entre alvos na mesma prioridade; efeitos em linha atravessam lacunas e perfuração continua atrás do alvo na mesma linha.

---

## 9. Ciclo do Turno

### 9.1 Fase de Preparação

Os participantes planejam simultaneamente dentro de um limite de tempo.

Possíveis ordens:

- atacar;
- defender;
- usar habilidade;
- conjurar feitiço;
- usar item;
- reposicionar;
- colocar herói da reserva em campo;
- outras ações futuras autorizadas pelas regras.

- **Ataque básico e modo de defesa custam 0 Mana.** Sempre existe uma ação útil disponível.
- Habilidades, feitiços, itens, reposicionamentos especiais e substituições podem consumir Mana.
- Habilidades mais poderosas possuem custos maiores e tornam-se naturalmente opções de lategame.
- O modo de defesa permite planos de early game defensivos que preservam recursos para curvas de poder tardias.
- Suportes podem gerar, preservar, reduzir, aumentar, transferir ou reagir ao gasto de Mana conforme suas habilidades específicas.

Cada ordem possui custo, alvos válidos, restrições posicionais e pré-condições. O cliente mostra a intenção, mas o servidor valida tudo.

A fase termina quando todos confirmam ou quando o cronômetro acaba. O servidor bloqueia o plano final antes da resolução.

### 9.2 Fase de Resolução

O servidor determina a sequência usando velocidade, prioridade da ação, modificadores e critérios de desempate definidos.

```text
Bloquear planos → calcular ordem → executar eventos
  → aplicar dano/cura/status/movimento/entrada/saída
  → verificar derrota, vitória e gatilhos
  → publicar log e novo estado → próxima Preparação
```

Animações representam os eventos confirmados; elas não decidem o resultado.

### 9.3 Desconexão e WO

- Em modos competitivos, abandonar ou exceder a janela de reconexão resulta em derrota por WO.
- O WO afeta o ranking e pode aplicar punições adicionais de fila, recompensa ou reincidência.
- O servidor, não o cliente desconectado, registra o resultado.
- A duração da tolerância e a escala das punições ainda precisam ser definidas.
- Em campanha/PvE cooperativo, a recuperação deve priorizar reconexão e continuidade do grupo; a regra competitiva não será copiada automaticamente.

### Interface de referência

A referência visual enviada por Wall define a direção macro:

- identidade azul versus vermelho;
- ordem de turno persistente;
- timer central e status de confirmação;
- grade e faixas posicionais legíveis;
- Mana visível e ações com custo explícito;
- painel da ação selecionada;
- log fechado por padrão, aberto como gaveta com plano local, turno atual, histórico e sistema;
- grande comando de confirmação da estratégia.

A composição, os estados, controles, responsividade, contratos de alvo e critérios de aceite estão definidos em `BATTLE_SYSTEM_SPEC.md`. A imagem continua sendo referência de direção; esse documento é o contrato canônico implementável.

---

## 10. Mana e Curva Estratégica

### Confirmado

- Mana é a economia universal de batalha nos modos PvE, PvP, cooperativo e Brawl.
- Ela funciona como a moeda de turno de Hearthstone: a capacidade cresce ao longo das rodadas e é renovada para a nova Preparação.
- Ataque básico e defesa custam 0.
- Cada habilidade tem custo próprio; habilidades mais determinantes exigem mais Mana.
- Substituir/descer um herói da reserva consome Mana.
- O mesmo orçamento atende ações, habilidades e mudanças de composição; não existe um sistema paralelo de PA.
- Suportes podem interagir com a economia de Mana e criar identidades de deck/composição.

### Objetivo de design

A curva de Mana cria momentos diferentes dentro da mesma batalha:

- **Early game:** ataques básicos, defesa, preparação de tabuleiro e economia.
- **Mid game:** habilidades de sinergia, substituições e disputas por posição.
- **Late game:** habilidades de alto impacto, combos e condições de vitória construídas ao longo dos turnos.

### Curva técnica v1

- Turno 1 começa com 1 Mana; o máximo cresce em 1 por turno até o teto de 10.
- A Mana disponível é renovada até o máximo no início de cada Preparação.
- Ataque básico e defesa custam 0; reposicionamento custa 1; item custa 2; substituição custa 3.
- Habilidades usam custos individuais entre 3 e 8 na implementação inicial.
- Os valores são uma primeira curva jogável e devem ser balanceados com telemetria e playtests; efeitos permitidos de aceleração, desconto e transferência ainda precisam ser definidos.

### Guardrails necessários

- Defesa gratuita não pode sustentar partidas infinitas; será necessário limite, pressão crescente, fadiga, desempate ou outra regra antistall.
- Manipulação de Mana por suportes precisa de limites por turno/efeito para não quebrar a curva planejada.
- Efeitos de redução de custo não podem transformar habilidades de lategame em abertura consistente sem contrapartida.

---

## 11. Autoridade e Persistência

### Servidor autoritativo

O servidor deve decidir:

- posição válida no mundo;
- início e participantes de encontros;
- composição e posição legal da batalha;
- custos, alvos e validade das ordens;
- resultado e aleatoriedade do combate;
- drops, XP, moedas, recrutamento e progressão;
- ações privilegiadas do Mestre;
- persistência de inventário, heróis, armas e consequências de campanha.

### Cliente

O cliente controla:

- input e intenção;
- câmera e apresentação;
- animações, partículas, áudio e feedback;
- HUD, menus e acessibilidade;
- previsão visual que nunca substitui a validação do servidor.

---

## 12. Papel do Mestre

O Mestre não é apenas um administrador. É um papel de jogo com autoridade narrativa controlada.

### Capacidades desejadas

- preparar capítulos, mapas, cenas e encontros;
- selecionar participantes;
- transportar jogadores;
- abrir, fechar ou isolar áreas;
- controlar NPCs e inimigos;
- narrar para todos ou para grupos específicos;
- iniciar objetivos e alterar estados de quest;
- disparar cenas, batalhas e consequências;
- conceder recompensas auditáveis;
- encerrar a sessão e devolver jogadores ao mundo persistente.

### Proteções necessárias

- autenticação GM sem credencial padrão em produção;
- log de comandos e recompensas;
- escopo de campanha/instância explícito;
- confirmação para ações destrutivas ou irreversíveis;
- possibilidade de restaurar jogadores presos por falha de sessão.

### Modelo arquitetural proposto para campanhas

Uma campanha deve executar como uma **instância de sessão controlada pelo servidor**, não como mutações improvisadas no mapa público:

1. `CampaignDefinition` guarda o conteúdo preparado: cenas, áreas, objetivos, encontros e recompensas possíveis.
2. `CampaignSession` registra participantes, estado atual, decisões, checkpoints e comandos do Mestre.
3. Ao entrar, cada jogador recebe um ponto de retorno seguro ao mundo persistente.
4. Durante a sessão, transporte e bloqueios afetam somente a instância/escopo correto.
5. Ao encerrar, o servidor aplica recompensas e consequências autorizadas e devolve os jogadores.
6. Se a sessão falhar, um mecanismo de recuperação usa o checkpoint e o ponto de retorno.

O mundo permanente e a campanha compartilham conta, coleção, armas, economia e consequências; não são produtos isolados.

---

## 13. Decisões em Aberto

Estas questões não devem ser implementadas por suposição:

As decisões de Mana v1, custo de substituição, timeout, profundidade, lacunas, escolha entre alvos e direção antistall agora possuem contrato em `BATTLE_SYSTEM_SPEC.md`. Continuam abertas:

1. Quais interações de suporte com Mana são permitidas sem quebrar a curva de lategame?
2. Quais regras específicas de duração e destruição serão usadas por cada barreira, token, clone e invocação?
3. Qual é a janela de reconexão antes de uma derrota por WO?
4. Quais punições de ranking, fila ou recompensa acompanham o WO em cada modo competitivo?
5. Como desconexão funciona em PvE cooperativo e campanha, onde ranking pode não ser aplicável?
6. Como efeitos de área distinguem aliados, inimigos e entidades neutras em cada catálogo de habilidade?
7. Como o PvPvE posiciona entidades neutras e define sua tabela de ameaça?
8. Como emparelhamento, vida do jogador e eliminação funcionam no Brawl de oito jogadores?
9. Duelo e Brawl usam poder persistente integral, matchmaking por faixa ou normalização competitiva?
10. Quais valores finais da Pressão do Coliseu impedem stall sem apagar estratégias defensivas?
11. O mundo 3D usa câmera fixa por cena, câmera orbital limitada ou seguimento livre?
12. Qual é o primeiro hardware mínimo alvo para exploração 3D?
13. Como progressão infinita evita tornar regiões antigas e novos jogadores irrelevantes?

---

## 14. Ordem Recomendada para os Próximos Aprofundamentos

1. **Implementação do contrato da batalha:** executar `BATTLE_SYSTEM_SPEC.md` em etapas, começando pela fundação visual e eventos tipados; reconexão/WO e valores de balanceamento continuam parametrizáveis.
2. **Mundo persistente versus campanha:** instâncias, transporte, isolamento e retorno seguro.
3. **Progressão e economia:** heróis, armas infinitas, itens, venda, upgrade e equilíbrio de longo prazo.
4. **Exploração 3D:** câmera, movimentação, visual, assets, colisão e vertical slice.
5. **Ferramentas do Mestre:** preparação de conteúdo, execução ao vivo, auditoria e recuperação.

Somente depois desses contratos o trabalho deve avançar para implementação estrutural extensa.
