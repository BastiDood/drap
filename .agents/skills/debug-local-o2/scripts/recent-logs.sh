# Fetch most recent logs.
# Usage: recent-logs.sh [minutes_back=5] [size=100]
set -euo pipefail

MINUTES="${1:-5}"
SIZE="${2:-100}"
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - MINUTES * 60 * 1000000 ))

curl -s -u "admin@example.com:password" \
  -X POST "http://localhost:5080/api/default/_search" \
  -H 'Content-Type: application/json' \
  -d @- <<EOF | jq '.hits'
{
  "query": {
    "sql": "SELECT * FROM default ORDER BY _timestamp DESC",
    "start_time": $START_US,
    "end_time": $NOW_US,
    "from": 0,
    "size": $SIZE
  }
}
EOF
