# Base de Coordenação dos Agentes

Esta pasta complementa o `AI_SYNC.md`. Ela contém o procedimento operacional e modelos; o quadro canônico de tarefas continua sendo o `AI_SYNC.md` na raiz.

## Arquivos

- `preflight.ps1`: diagnóstico seguro antes de iniciar uma sessão.
- `TASK_TEMPLATE.md`: formato para criar ou assumir um assignment.
- `HANDOFF_TEMPLATE.md`: checklist de conclusão ou passagem de contexto.

Nenhum segredo, token, senha ou conteúdo de `.env` deve ser copiado para esta pasta ou para logs de atividade.

## Início de sessão

1. Execute:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .ai/preflight.ps1 -Fetch
   ```

2. Leia o roadmap, o protocolo e os assignments ativos.
3. Confirme que os arquivos desejados não estão reservados por outro assignment.
4. Registre a tarefa no `AI_SYNC.md` usando o modelo.
5. Use branch própria. Se houver outra IA trabalhando ao mesmo tempo, use também worktree próprio.
6. Faça uma validação de baseline proporcional ao escopo antes de alterar código.

## Modos de operação

### Sessão exclusiva

Uma única IA usa `D:\MEGACOLISEUM`. Mudanças devem viver em uma branch de tarefa sempre que possível. A árvore deve estar limpa ou conter apenas alterações reconhecidas e atribuídas à sessão atual.

### Sessões simultâneas

Wall define assignments sem sobreposição e cada IA usa um worktree diferente:

```text
D:\MEGACOLISEUM                         integração / main
D:\MEGACOLISEUM-WORKTREES\antigravity  branch antigravity/<task-id>-<slug>
D:\MEGACOLISEUM-WORKTREES\codex        branch codex/<task-id>-<slug>
```

Branches não protegem processos que compartilham a mesma pasta. Nunca executar `git switch` ou `git checkout` numa árvore usada por outra sessão.

## Quando surgir conflito de escopo

- Pare apenas a parte conflitante; continue trabalho independente que permaneça seguro.
- Marque a tarefa como `BLOQUEADO` se ela não puder avançar.
- Registre arquivo/contrato em conflito, owner atual e condição de desbloqueio.
- Não resolva conflito escolhendo silenciosamente uma versão nem apagando mudanças do outro agente.

## IDs sugeridos

- `BUG-nnn`: correção de defeito.
- `GAME-nnn`: mecânica ou runtime do jogo.
- `UI-nnn`: tela, HUD ou fluxo visual.
- `DB-nnn`: schema, persistência ou migration.
- `NET-nnn`: Colyseus, protocolo ou multiplayer.
- `SEC-nnn`: segurança.
- `OPS-nnn`: ferramentas, CI ou coordenação.
- `DOCS-nnn`: documentação.

## Encerramento

1. Execute as validações prometidas no assignment.
2. Atualize o log e o status no `AI_SYNC.md`.
3. Preencha o handoff, inclusive o que não foi testado.
4. Revise `git diff --check` e `git status`.
5. Só então faça commit/push quando isso estiver autorizado e for útil ao fluxo.
