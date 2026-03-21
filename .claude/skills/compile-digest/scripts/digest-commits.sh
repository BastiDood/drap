# List commits since a cutoff date.
# Usage: digest-commits.sh <since_date> [branch=main]
#   since_date: any format git understands (ISO 8601, relative, etc.)
#   branch: branch to inspect (default: main)
set -euo pipefail

SINCE="$1"
BRANCH="${2:-main}"

git log "$BRANCH" --since="$SINCE" --reverse --no-merges --format='%h %aI %an — %s'
