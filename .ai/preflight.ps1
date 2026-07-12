param(
    [switch]$Fetch
)

$ErrorActionPreference = 'Stop'

function Write-Section([string]$Title) {
    Write-Host ""
    Write-Host "== $Title ==" -ForegroundColor Cyan
}

$repoRoot = (git rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    Write-Error 'Execute este script dentro do repositorio MEGACOLISEUM.'
    exit 1
}

Set-Location $repoRoot

$requiredFiles = @(
    'AGENTS.md',
    'AI_SYNC.md',
    'PROJECT_ROADMAP.md',
    '.ai/README.md',
    '.ai/TASK_TEMPLATE.md',
    '.ai/HANDOFF_TEMPLATE.md'
)

$missing = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missing.Count -gt 0) {
    Write-Error "Arquivos obrigatorios ausentes: $($missing -join ', ')"
    exit 1
}

if ($Fetch) {
    Write-Section 'Atualizando referencia do remoto'
    git fetch origin
    if ($LASTEXITCODE -ne 0) {
        Write-Error 'Falha ao executar git fetch origin.'
        exit 1
    }
}

$branch = (git branch --show-current).Trim()
$status = @(git status --short)

Write-Section 'Sessao'
Write-Host "Repositorio: $repoRoot"
Write-Host "Branch:      $branch"

if ($branch -eq 'main') {
    Write-Warning 'Voce esta na main. Prefira uma branch de tarefa antes de editar.'
}

Write-Section 'Arvore de trabalho'
if ($status.Count -eq 0) {
    Write-Host 'Limpa.' -ForegroundColor Green
} else {
    Write-Warning 'Ha alteracoes locais. Confirme que pertencem ao assignment atual:'
    $status | ForEach-Object { Write-Host "  $_" }
}

git show-ref --verify --quiet refs/remotes/origin/main
if ($LASTEXITCODE -eq 0) {
    $counts = (git rev-list --left-right --count HEAD...origin/main).Trim() -split '\s+'
Write-Section 'Relacao com origin/main'
    Write-Host "Commits apenas na branch atual: $($counts[0])"
    Write-Host "Commits apenas em origin/main:  $($counts[1])"
    if ([int]$counts[1] -gt 0) {
        Write-Warning 'A branch esta atras de origin/main. Atualize-a antes de modificar contratos compartilhados.'
    }
}

Write-Section 'Assignments que exigem atencao'
$assignmentLines = @(Get-Content -Encoding utf8 'AI_SYNC.md' | Where-Object {
    $_ -match '^\|' -and $_ -match 'Em andamento|EM ANDAMENTO|Bloqueado|BLOQUEADO'
} | ForEach-Object { $_.Trim() })
if ($assignmentLines.Count -eq 0) {
    Write-Host 'Nenhum assignment ativo ou bloqueado encontrado.'
} else {
    $assignmentLines | ForEach-Object { Write-Host "  $_" }
}

Write-Section 'Proximo passo'
Write-Host 'Leia o assignment, confirme os arquivos reservados e atualize AI_SYNC.md antes da primeira alteracao funcional.'
