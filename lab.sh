#!/usr/bin/env bash
# ============================================================
# CTO Discovery Lab — orquestração local
# Uso: ./lab.sh {bootstrap|start|stop|status|seed|verify|reset|backup}
# Funciona em bash (macOS/Linux) e Git Bash (Windows).
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE_MAIN="docker compose -f infrastructure/docker-compose.yml"
COMPOSE_PLANE="docker compose -p plane -f infrastructure/plane/docker-compose.yml --env-file infrastructure/plane/plane.env"
STATE_DIR=".lab-state"

log()  { printf '\033[1;34m[lab]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m  ✗\033[0m %s\n' "$*"; }

require() {
  command -v "$1" >/dev/null 2>&1 || { fail "dependência ausente: $1"; exit 1; }
}

gen_hex() { node -e "console.log(require('crypto').randomBytes($1).toString('hex'))"; }

ensure_plane_env() {
  if [ ! -f infrastructure/plane/plane.env ]; then
    log "Gerando infrastructure/plane/plane.env com segredos aleatórios…"
    sed -e "s/^SECRET_KEY=__GENERATED_BY_BOOTSTRAP__/SECRET_KEY=$(gen_hex 32)/" \
        -e "s/^LIVE_SERVER_SECRET_KEY=__GENERATED_BY_BOOTSTRAP__/LIVE_SERVER_SECRET_KEY=$(gen_hex 32)/" \
        -e "s/^AWS_SECRET_ACCESS_KEY=__GENERATED_BY_BOOTSTRAP__/AWS_SECRET_ACCESS_KEY=$(gen_hex 20)/" \
        infrastructure/plane/plane.env.example > infrastructure/plane/plane.env
  fi
}

wait_url() { # wait_url <url> <nome> [tentativas]
  local url="$1" name="$2" tries="${3:-60}"
  for _ in $(seq 1 "$tries"); do
    if curl -sf -o /dev/null "$url"; then ok "$name"; return 0; fi
    sleep 3
  done
  fail "$name não respondeu ($url)"; return 1
}

start_apps() {
  mkdir -p "$STATE_DIR"
  if [ ! -d apps/medagenda-api/dist ]; then
    log "Compilando API…"; npm run build --workspace apps/medagenda-api >/dev/null
  fi
  if [ ! -d apps/medagenda-web/.next ] || [ ! -f apps/medagenda-web/.next/BUILD_ID ]; then
    log "Compilando Web…"; npm run build --workspace apps/medagenda-web >/dev/null
  fi
  log "Iniciando MedAgenda API (porta 3002)…"
  (cd apps/medagenda-api && nohup node dist/main.js > ../../"$STATE_DIR"/api.log 2>&1 & echo $! > ../../"$STATE_DIR"/api.pid)
  log "Iniciando MedAgenda Web (porta 3001)…"
  (cd apps/medagenda-web && nohup npm run start > ../../"$STATE_DIR"/web.log 2>&1 & echo $! > ../../"$STATE_DIR"/web.pid)
}

stop_apps() {
  for svc in api web; do
    if [ -f "$STATE_DIR/$svc.pid" ]; then
      kill "$(cat "$STATE_DIR/$svc.pid")" 2>/dev/null || true
      rm -f "$STATE_DIR/$svc.pid"
      log "MedAgenda $svc parado."
    fi
  done
}

cmd_bootstrap() {
  require docker; require node; require npm; require git; require curl
  log "1/7 Instalando dependências do monorepo…"
  npm install
  log "2/7 Compilando pacotes compartilhados…"
  npm run build --workspace packages/shared-types
  npm run build --workspace packages/shared-validation
  ensure_plane_env
  log "3/7 Subindo infraestrutura (Postgres, Mattermost, Forgejo, Plane)…"
  $COMPOSE_MAIN up -d
  $COMPOSE_PLANE up -d
  wait_url "http://localhost:8065/api/v4/system/ping" "Mattermost"
  wait_url "http://localhost:3000/api/healthz" "Forgejo"
  wait_url "http://localhost:8080/auth/get-csrf-token/" "Plane" 90
  log "4/7 Migrations + seed do MedAgenda…"
  (cd apps/medagenda-api && npx prisma migrate deploy && npm run prisma:seed)
  log "5/7 Provisionando Mattermost (usuários, canais, bot, transcrições)…"
  node integrations/mattermost/setup.mjs
  node integrations/mattermost/publish-transcripts.mjs
  log "6/7 Provisionando Forgejo (admin, repo, push do monorepo)…"
  node integrations/forgejo/setup.mjs
  log "7/7 Provisionando Plane (instância, workspace, API token)…"
  docker cp integrations/plane/bootstrap-instance.py plane-api-1:/tmp/bootstrap-instance.py
  docker exec -w /code -e PYTHONPATH=/code plane-api-1 python /tmp/bootstrap-instance.py \
    | tee "$STATE_DIR/plane-bootstrap.out"
  grep -E '^PLANE_' "$STATE_DIR/plane-bootstrap.out" > "$STATE_DIR/plane.env" || true
  echo "PLANE_URL=http://localhost:8080" >> "$STATE_DIR/plane.env"
  start_apps
  log "Bootstrap concluído. Rode ./lab.sh verify"
}

cmd_start() {
  ensure_plane_env
  log "Subindo containers…"
  $COMPOSE_MAIN up -d
  $COMPOSE_PLANE up -d
  start_apps
  cmd_status || true
}

cmd_stop() {
  stop_apps
  log "Parando containers…"
  $COMPOSE_MAIN stop
  $COMPOSE_PLANE stop
}

cmd_status() {
  log "Containers:"
  $COMPOSE_MAIN ps --format 'table {{.Name}}\t{{.Status}}' || true
  $COMPOSE_PLANE ps --format 'table {{.Name}}\t{{.Status}}' || true
  log "Serviços HTTP:"
  curl -sf -o /dev/null http://localhost:3002/api/health && ok "MedAgenda API  http://localhost:3002/api" || fail "MedAgenda API  http://localhost:3002/api"
  curl -sf -o /dev/null http://localhost:3001/login     && ok "MedAgenda Web  http://localhost:3001" || fail "MedAgenda Web  http://localhost:3001"
  curl -sf -o /dev/null http://localhost:8065/api/v4/system/ping && ok "Mattermost     http://localhost:8065" || fail "Mattermost     http://localhost:8065"
  curl -sf -o /dev/null http://localhost:3000/api/healthz && ok "Forgejo        http://localhost:3000" || fail "Forgejo        http://localhost:3000"
  curl -sf -o /dev/null http://localhost:8080 && ok "Plane          http://localhost:8080" || fail "Plane          http://localhost:8080"
}

cmd_seed() {
  (cd apps/medagenda-api && npx prisma migrate deploy && npm run prisma:seed)
}

cmd_verify() {
  mkdir -p output/evidence
  local report="output/evidence/verify-$(date +%Y%m%d-%H%M%S).md"
  log "Verificando o laboratório (relatório: $report)…"
  {
    echo "# Verificação do laboratório — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo
  } > "$report"
  local pass=0 total=0
  check() { # check <descricao> <comando...>
    local desc="$1"; shift
    total=$((total+1))
    if "$@" >/dev/null 2>&1; then
      ok "$desc"; echo "- [x] $desc" >> "$report"; pass=$((pass+1))
    else
      fail "$desc"; echo "- [ ] $desc" >> "$report"
    fi
  }
  check "MedAgenda API respondendo"      curl -sf http://localhost:3002/api/health
  check "MedAgenda Web respondendo"      curl -sf http://localhost:3001/login
  check "Login na API funciona"          curl -sf -X POST http://localhost:3002/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@medagenda.local","password":"admin123"}'
  check "Mattermost respondendo"         curl -sf http://localhost:8065/api/v4/system/ping
  check "Transcrição negócio publicada"  node integrations/mattermost/mm.mjs read negocio-medagenda
  check "Forgejo respondendo"            curl -sf http://localhost:3000/api/healthz
  check "Repo cto-discovery-lab existe"  curl -sf http://localhost:3000/api/v1/repos/labadmin/cto-discovery-lab
  check "Plane respondendo"              curl -sf http://localhost:8080/auth/get-csrf-token/
  check "BMAD instalado (_bmad/)"        test -d _bmad
  log "Rodando testes da API (unit + e2e, inclui conflito de horário)…"
  if npm run test --workspace apps/medagenda-api >> "$report" 2>&1 \
     && npm run test:e2e --workspace apps/medagenda-api >> "$report" 2>&1; then
    ok "Testes da API passaram"; echo "- [x] Testes unit + e2e da API" >> "$report"; pass=$((pass+1))
  else
    fail "Testes da API falharam (ver relatório)"; echo "- [ ] Testes unit + e2e da API" >> "$report"
  fi
  total=$((total+1))
  log "Resultado: $pass/$total verificações OK — relatório em $report"
  [ "$pass" -eq "$total" ]
}

cmd_reset() {
  if [ "${1:-}" != "--yes" ]; then
    printf '\033[1;31mISSO APAGA TODOS OS DADOS (volumes, tokens, estado). Confirma? [digite: sim]\033[0m '
    read -r answer
    [ "$answer" = "sim" ] || { log "Abortado."; exit 1; }
  fi
  stop_apps
  $COMPOSE_MAIN down -v
  $COMPOSE_PLANE down -v
  rm -rf "$STATE_DIR"
  log "Reset concluído. Rode ./lab.sh bootstrap para recomeçar."
}

cmd_backup() {
  local dir="backups/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$dir"
  log "Backup dos bancos em $dir…"
  docker exec lab-postgres pg_dump -U lab medagenda   > "$dir/medagenda.sql"
  docker exec lab-postgres pg_dump -U lab mattermost  > "$dir/mattermost.sql" || true
  docker exec plane-plane-db-1 pg_dump -U plane plane > "$dir/plane.sql" || true
  cp -r "$STATE_DIR" "$dir/lab-state" 2>/dev/null || true
  ok "Backup salvo em $dir"
}

case "${1:-}" in
  bootstrap) cmd_bootstrap ;;
  start)     cmd_start ;;
  stop)      cmd_stop ;;
  status)    cmd_status ;;
  seed)      cmd_seed ;;
  verify)    cmd_verify ;;
  reset)     cmd_reset "${2:-}" ;;
  backup)    cmd_backup ;;
  panel)     log "Painel em http://localhost:3999"; node scripts/panel.mjs ;;
  *) echo "Uso: ./lab.sh {bootstrap|start|stop|status|seed|verify|reset [--yes]|backup|panel}"; exit 1 ;;
esac
