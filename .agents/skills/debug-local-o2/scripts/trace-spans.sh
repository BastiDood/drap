# Fetch all spans for a specific trace ID from the trace stream.
# Usage: trace-spans.sh <trace_id> [minutes_back=60] [stream=default]
set -euo pipefail

TRACE_ID="${1:?Usage: trace-spans.sh <trace_id> [minutes_back=60] [stream=default]}"
MINUTES="${2:-60}"
STREAM="${3:-default}"
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - MINUTES * 60 * 1000000 ))

curl -s -u "admin@example.com:password" \
  -X POST "http://localhost:5080/api/default/_search?type=traces" \
  -H 'Content-Type: application/json' \
  -d @- <<EOF | jq '.hits'
{
  "query": {
    "sql": "SELECT * FROM $STREAM WHERE trace_id = '$TRACE_ID' ORDER BY start_time ASC",
    "start_time": $START_US,
    "end_time": $NOW_US,
    "from": 0,
    "size": -1
  }
}
EOF
