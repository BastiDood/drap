# List all available O2 streams (logs + traces).
set -euo pipefail

echo "=== Log Streams ==="
curl -s -u "admin@example.com:password" "http://localhost:5080/api/default/streams?type=logs" | jq -r '.list[] | "\(.name)\t\(.stats.doc_num) docs"'

echo ""
echo "=== Trace Streams ==="
curl -s -u "admin@example.com:password" "http://localhost:5080/api/default/streams?type=traces" | jq -r '.list[] | "\(.name)\t\(.stats.doc_num) docs"'
