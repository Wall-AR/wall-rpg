# Modelo de Handoff

Adicione uma entrada ao **Log de Atividades** do `AI_SYNC.md`:

```markdown
[AAAA-MM-DD] [AGENTE] [TASK-ID] [TIPO] Resumo objetivo
  - Comportamento alterado: ...
  - Arquivos criados/modificados/removidos: ...
  - Contratos, APIs ou migrations: ...
  - Validação automatizada: comando + resultado
  - Teste manual: roteiro + resultado
  - Não testado: ...
  - Riscos, mocks e fallbacks mantidos: ...
  - Próximos passos: ...
  - Branch/commit: ...
  - Status: CONCLUÍDO | EM REVISÃO | BLOQUEADO
```

Checklist de saída:

- [ ] Assignment reflete o status real.
- [ ] Nenhum arquivo ficou reservado indevidamente.
- [ ] `git diff --check` passou.
- [ ] Typecheck/build/testes prometidos foram executados.
- [ ] Falhas e warnings foram registrados, não ocultados.
- [ ] O handoff distingue DB real, fallback in-memory e mock visual.
- [ ] Branch/commit informados quando existirem.
