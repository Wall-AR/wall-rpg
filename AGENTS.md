# Acordos Operacionais do MEGACOLISEUM

Estas instruções valem para qualquer agente de IA que trabalhe neste repositório.

## Antes de editar

1. Leia `PROJECT_ROADMAP.md`, `AI_SYNC.md` e `.ai/README.md`.
2. Execute `powershell -ExecutionPolicy Bypass -File .ai/preflight.ps1 -Fetch`.
3. Não altere arquivos se houver mudanças não reconhecidas de outra pessoa ou agente. Preserve-as e coordene pelo `AI_SYNC.md`.
4. Registre ou assuma um assignment no `AI_SYNC.md` com ID, owner, status, branch/worktree, arquivos reservados e validação esperada.
5. Só comece alterações funcionais depois desse registro.

## Coordenação

- `AI_SYNC.md` é o quadro canônico de coordenação e deve refletir o estado real da tarefa.
- Uma tarefa ativa tem um único owner. O assignment específico prevalece sobre as zonas gerais de responsabilidade.
- `LIVRE` significa disponível para reserva, não autorização para editar sem registro.
- Não amplie o escopo silenciosamente. Registre novos arquivos e dependências antes de tocá-los.
- Não troque de branch numa pasta que outro agente possa estar usando.
- Trabalho simultâneo exige worktrees separados. `D:\MEGACOLISEUM` deve permanecer como área de integração quando houver duas sessões ativas.
- Não faça push direto em `main`, não force push e não sobrescreva mudanças alheias.
- Não use comandos destrutivos para limpar o repositório. Nunca descarte alterações que não foram criadas pela tarefa atual.

## Handoff obrigatório

Antes de encerrar uma tarefa:

1. Atualize o histórico e o assignment no `AI_SYNC.md`.
2. Registre comportamento alterado, arquivos, contratos/migrações, validações, testes manuais, riscos, mocks mantidos e próximos passos.
3. Execute, no mínimo, `npm run lint` e `npm run build` para mudanças de código.
4. Faça o roteiro manual correspondente ao fluxo afetado enquanto não houver testes automatizados.
5. Informe branch e commit quando existirem. Commit, push e merge devem ser ações intencionais e rastreáveis.

Use `.ai/TASK_TEMPLATE.md` e `.ai/HANDOFF_TEMPLATE.md` como formato padrão.

## Invariantes técnicos

- Backend TypeScript em ESM: imports relativos internos usam extensão `.js`.
- Frontend React 18 + Vite + PixiJS 8 + TailwindCSS; não introduza outro sistema de estilos sem decisão explícita.
- Multiplayer em Colyseus 0.17. No cliente, callbacks de estado usam `Callbacks.get(room)`.
- PostgreSQL/Drizzle com fallback in-memory. Declare se cada fluxo usa DB real, fallback ou mock visual.
- Não remova fallbacks existentes sem garantir o modo sem banco.
- Schema, migrations, tipos compartilhados, fórmulas de progressão e payloads de rede são contratos de alto conflito.
- Não gere migration concorrente. Atualize a branch com `origin/main` antes de executar o Drizzle e preserve migrations já publicadas.
- Não trate typecheck ou tela renderizada como prova de integração completa.

## Verdade do produto

- Separe claramente dado persistido, fallback in-memory e conteúdo de mockup.
- Decisões ainda abertas no roadmap não podem ser transformadas em regra definitiva sem aprovação de Wall.
- Preserve a fantasia central: RPG multiplayer com GM ao vivo, batalha 3v3, colecionismo emocional e progressão duradoura de armas.
