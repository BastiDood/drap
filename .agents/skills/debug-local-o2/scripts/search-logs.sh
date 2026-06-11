# Search logs with a SQL WHERE clause.
# Usage: search-logs.sh <where_clause> [minutes_back=30] [size=50]
# Example: search-logs.sh "str_match(body, 'error')" 15 100
set -euo pipefail

WHERE="${1:?Usage: search-logs.sh <where_clause> [minutes_back=30] [size=50]}"
MINUTES="${2:-30}"
SIZE="${3:-50}"
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - MINUTES * 60 * 1000000 ))

curl -s -u "admin@example.com:password" \
  -X POST "http://localhost:5080/api/default/_search" \
  -H 'Content-Type: application/json' \
  -d @- <<EOF | jq '.hits'
{
  "query": {
    "sql": "SELECT * FROM default WHERE $WHERE ORDER BY _timestamp DESC",
    "start_time": $START_US,
    "end_time": $NOW_US,
    "from": 0,
    "size": $SIZE
  }
}
EOF
