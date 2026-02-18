# Search for error-level (and above) log records.
# Usage: search-errors.sh [minutes_back=30] [size=50]
set -euo pipefail

MINUTES="${1:-30}"
SIZE="${2:-50}"
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - MINUTES * 60 * 1000000 ))

curl -s -u "admin@example.com:password" \
  -X POST "http://localhost:5080/api/default/_search" \
  -H 'Content-Type: application/json' \
  -d @- <<EOF | jq '.hits'
{
  "query": {
    "sql": "SELECT * FROM default WHERE severity >= 17 ORDER BY _timestamp DESC",
    "start_time": $START_US,
    "end_time": $NOW_US,
    "from": 0,
    "size": $SIZE
  }
}
EOF
