(
  environment="${1:-}"
  set -a
  [[ -f .env ]] && . ./.env
  if [[ -n "$environment" ]]; then
    [[ -f ".env.$environment" ]] && . "./.env.$environment"
    [[ -f ".env.$environment.local" ]] && . "./.env.$environment.local"
  fi
  set +a
  pnpm test:playwright
)
