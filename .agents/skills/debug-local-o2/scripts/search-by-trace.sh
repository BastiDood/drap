# Search log records associated with a specific trace ID.
# Usage: search-by-trace.sh <trace_id> [minutes_back=60]
set -euo pipefail

TRACE_ID="${1:?Usage: search-by-trace.sh <trace_id> [minutes_back=60]}"
MINUTES="${2:-60}"
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - MINUTES * 60 * 1000000 ))

curl -s -u "admin@example.com:password" \
  -X POST "http://localhost:5080/api/default/_search" \
  -H 'Content-Type: application/json' \
  -d @- <<EOF | jq '.hits'
{
  "query": {
    "sql": "SELECT * FROM default WHERE trace_id = '$TRACE_ID' ORDER BY _timestamp ASC",
    "start_time": $START_US,
    "end_time": $NOW_US,
    "from": 0,
    "size": -1
  }
}
EOF
