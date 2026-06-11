# Search logs for a specific HTTP route path.
# Usage: search-by-route.sh <route_path> [minutes_back=30] [size=50]
# Example: search-by-route.sh "/dashboard/admin/labs" 15
set -euo pipefail

ROUTE="${1:?Usage: search-by-route.sh <route_path> [minutes_back=30] [size=50]}"
MINUTES="${2:-30}"
SIZE="${3:-50}"
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - MINUTES * 60 * 1000000 ))

SERVICE=$(echo "$ROUTE" | tr '/' '.')

curl -s -u "admin@example.com:password" \
  -X POST "http://localhost:5080/api/default/_search" \
  -H 'Content-Type: application/json' \
  -d @- <<EOF | jq '.hits'
{
  "query": {
    "sql": "SELECT * FROM default WHERE str_match(body, '$ROUTE') OR str_match(service_name, '$SERVICE') ORDER BY _timestamp DESC",
    "start_time": $START_US,
    "end_time": $NOW_US,
    "from": 0,
    "size": $SIZE
  }
}
EOF
