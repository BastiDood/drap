# List merged PRs since a cutoff date.
# Usage: digest-merged-prs.sh <since_iso8601> [base_branch=main]
#   since_iso8601: e.g. "2026-03-07T00:00:00Z"
#   base_branch: target branch (default: main)
set -euo pipefail

SINCE="$1"
BASE="${2:-main}"

gh pr list \
  --state merged \
  --base "$BASE" \
  --search "merged:>=$SINCE" \
  --json number,title,author,mergedAt,url,labels \
  --jq 'sort_by(.mergedAt)' \
  --limit 200
