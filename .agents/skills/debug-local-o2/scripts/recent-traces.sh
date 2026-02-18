# Fetch latest traces overview.
# Usage: recent-traces.sh [minutes_back=15] [size=25] [stream=default]
set -euo pipefail

MINUTES="${1:-15}"
SIZE="${2:-25}"
STREAM="${3:-default}"
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - MINUTES * 60 * 1000000 ))

curl -s -u "admin@example.com:password" \
  "http://localhost:5080/api/default/$STREAM/traces/latest?start_time=$START_US&end_time=$NOW_US&from=0&size=$SIZE" \
  | jq '.'
