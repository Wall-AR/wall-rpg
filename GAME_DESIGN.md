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
- A batalha alterna **Preparação** e **Resolução**.
- A Preparação permite planejar ações, gastar PA, reposicionar e colocar heróis da reserva em campo.
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

## 6. Encontros e Lobby de Batalha

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

---

## 7. Campo de Batalha

### Grade

Cada lado possui nove casas:

```text
TRÁS    [ 1 ] [ 2 ] [ 3 ]
MEIO    [ 4 ] [ 5 ] [ 6 ]
FRENTE  [ 7 ] [ 8 ] [ 9 ]
```

A orientação visual pode ser espelhada entre equipes, mas os identificadores lógicos das casas devem permanecer estáveis.

### Ocupação

- Três heróis começam em campo.
- Os três heróis restantes ficam na reserva.
- Heróis da reserva podem entrar durante a Preparação mediante custo e condição válidos.
- O campo suporta até seis heróis ativos por lado, deixando espaços para reposicionamento, invocações, obstáculos ou efeitos de área.

### Efeito de posição — intenção inicial

- **Frente:** maior acesso a ataques corpo a corpo e maior exposição.
- **Meio:** faixa híbrida para suporte, alcance intermediário e proteção parcial.
- **Trás:** maior segurança para suporte/alcance, com restrições contra alvos protegidos.

As fórmulas exatas ainda não estão decididas.

---

## 8. Ciclo do Turno

### 8.1 Fase de Preparação

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

Cada ordem possui custo, alvos válidos, restrições posicionais e pré-condições. O cliente mostra a intenção, mas o servidor valida tudo.

A fase termina quando todos confirmam ou quando o cronômetro acaba. O servidor bloqueia o plano final antes da resolução.

### 8.2 Fase de Resolução

O servidor determina a sequência usando velocidade, prioridade da ação, modificadores e critérios de desempate definidos.

```text
Bloquear planos → calcular ordem → executar eventos
  → aplicar dano/cura/status/movimento/entrada/saída
  → verificar derrota, vitória e gatilhos
  → publicar log e novo estado → próxima Preparação
```

Animações representam os eventos confirmados; elas não decidem o resultado.

### Interface de referência

A referência visual enviada por Wall define a direção macro:

- identidade azul versus vermelho;
- ordem de turno persistente;
- timer central e status de confirmação;
- grade e faixas posicionais legíveis;
- PA visível e ações com custo explícito;
- painel da ação selecionada;
- log separado entre ações planejadas e histórico resolvido;
- grande comando de confirmação da estratégia.

---

## 9. Pontos de Ação e Entrada da Reserva

### Confirmado

- A Preparação usa uma moeda/custo de ações.
- Colocar um herói da reserva em campo também exige recurso acumulado.
- O recurso cresce conforme a batalha avança, permitindo aumentar a presença no tabuleiro.

### Decisão crítica aberta

Definir se existe:

1. **um único PA** para ações e entrada de heróis;
2. **PA + recurso de convocação** separados;
3. **PA por herói + recurso global da equipe**.

A referência visual mostra `PA 4/10` e regeneração temporal. Ainda precisa ser decidido se o PA regenera durante o cronômetro, apenas por turno ou por eventos de combate. Essa decisão altera profundamente o ritmo e a possibilidade de espera estratégica.

---

## 10. Autoridade e Persistência

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

## 11. Papel do Mestre

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

## 12. Decisões em Aberto

Estas questões não devem ser implementadas por suposição:

1. Batalha de campanha é um jogador contra IA, vários jogadores cooperando ou ambos?
2. Cada jogador controla seus seis heróis ou existe uma equipe compartilhada pelo grupo?
3. PA de ações e recurso de entrada da reserva são o mesmo sistema?
4. Como PA é recuperado: por turno, tempo real, ação, dano ou combinação?
5. O que acontece quando o timer acaba sem confirmação?
6. Uma casa comporta exatamente uma unidade? Invocações usam as mesmas casas?
7. Como alcance, bloqueio e troca de alvo funcionam entre frente/meio/trás?
8. Qual é a condição e o custo para retirar um herói ativo ou substituir um derrotado?
9. Como derrota, fuga, desconexão e retorno à batalha funcionam?
10. O mundo 3D usa câmera fixa por cena, câmera orbital limitada ou seguimento livre?
11. Qual é o primeiro hardware e viewport alvo: desktop apenas ou mobile desde o início?
12. Como progressão infinita evita tornar regiões antigas e novos jogadores irrelevantes?

---

## 13. Ordem Recomendada para os Próximos Aprofundamentos

1. **Contrato da batalha:** PA, convocação, grade, alvo, resolução, vitória e desconexão.
2. **Mundo persistente versus campanha:** instâncias, transporte, isolamento e retorno seguro.
3. **Progressão e economia:** heróis, armas infinitas, itens, venda, upgrade e equilíbrio de longo prazo.
4. **Exploração 3D:** câmera, movimentação, visual, assets, colisão e vertical slice.
5. **Ferramentas do Mestre:** preparação de conteúdo, execução ao vivo, auditoria e recuperação.

Somente depois desses contratos o trabalho deve avançar para implementação estrutural extensa.
