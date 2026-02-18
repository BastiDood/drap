---
name: debug-local-o2
description: >
  Query and inspect logs and traces from the local OpenObserve instance for debugging.
  Use when investigating errors, tracing request flows, inspecting spans,
  checking log output, or diagnosing issues in the running application.
compatibility: Requires `jq` to be installed on the system.
user-invocable: true
disable-model-invocation: false
allowed-tools:
  - Read
  - Bash(curl:*)
  - Bash(date:*)
  - Bash(jq:*)
  - Bash(bash:*)
---

# Debug OpenObserve Skill

Query and inspect logs and traces from the local OpenObserve (O2) instance.

**IMPORTANT:** The example scripts in `scripts/` are reference starting points. You should compose, edit, and synthesize your own `curl` + `jq` commands as needed for the specific debugging scenario.

## Prerequisites

- `pnpm docker:dev` must be running (starts O2 at `localhost:5080`)
- Read about the OpenTelemetry conventions used in this project

## Connection

| Property     | Value                              |
| ------------ | ---------------------------------- |
| Host         | `http://localhost:5080`            |
| Organization | `default`                          |
| Auth         | Basic `admin@example.com:password` |

## API Reference

### Log Search

**`POST /api/{org}/_search`** — SQL-based search across any stream.

```json
{
  "query": {
    "sql": "SELECT * FROM {stream} WHERE {conditions}",
    "start_time": 1674789786006000,
    "end_time": 1674793386006000,
    "from": 0,
    "size": 100
  }
}
```

- **Times are microseconds** (Unix seconds × 1,000,000)
- SQL is PostgreSQL-compatible
- `str_match(field, 'term')` — full-text search within a field
- `match_all('term')` — match any field containing term
- `size: -1` — return all results (no pagination)

**Response:**

```json
{ "took": 155, "hits": [...], "total": 27179, "from": 0, "size": 10, "scan_size": 28943 }
```

### Trace Search

**CRITICAL:** Trace queries require `?type=traces` on the search endpoint. Without it, O2 searches the log stream instead and fields like `start_time` will not be found.

**Overview — `GET /api/{org}/{stream}/traces/latest`**

Query params: `start_time`, `end_time`, `from`, `size`, `filter` (all required except filter).

Returns high-level trace list with trace IDs, durations, and service names.

**Span details — `POST /api/{org}/_search?type=traces`** with SQL against the trace stream:

```sql
SELECT * FROM default WHERE trace_id = '{id}' ORDER BY start_time
```

Use `size: -1` to retrieve all spans for a trace.

**Log fields:** `_timestamp`, `body`, `severity` (numeric: 1=TRACE, 5=DEBUG, 9=INFO, 13=WARN, 17=ERROR, 21=FATAL), `service_name`, `trace_id`, `span_id`, `instrumentation_library_name`

**Trace fields:** `trace_id`, `span_id`, `operation_name`, `service_name`, `duration`, `start_time`, `end_time`, `span_kind`, `span_status` (`UNSET`/`ERROR`), `http_route`, `http_response_status_code`, `status_code`, `status_message`

### Other Endpoints

| Endpoint                                                                 | Purpose                 |
| ------------------------------------------------------------------------ | ----------------------- |
| `GET /api/{org}/streams?type=logs`                                       | List log streams        |
| `GET /api/{org}/streams?type=traces`                                     | List trace streams      |
| `GET /api/{org}/{stream}/_around?key={ts}&size=N`                        | Logs around a timestamp |
| `GET /api/{org}/{stream}/_values?fields=...&start_time=&end_time=&size=` | Distinct field values   |

## Example Scripts

Pre-written queries for common debugging scenarios. **These are examples only** — compose your own `curl` commands as needed.

| Script                                           | Args                                    | Description                         |
| ------------------------------------------------ | --------------------------------------- | ----------------------------------- |
| [list-streams.sh](scripts/list-streams.sh)       | —                                       | List all O2 streams (logs + traces) |
| [recent-logs.sh](scripts/recent-logs.sh)         | `[minutes=5] [size=100]`                | Most recent logs                    |
| [recent-traces.sh](scripts/recent-traces.sh)     | `[minutes=15] [size=25]`                | Latest trace overview               |
| [search-logs.sh](scripts/search-logs.sh)         | `<where_clause> [minutes=30] [size=50]` | Search logs with SQL WHERE          |
| [search-errors.sh](scripts/search-errors.sh)     | `[minutes=30] [size=50]`                | Error-level logs only               |
| [search-by-trace.sh](scripts/search-by-trace.sh) | `<trace_id> [minutes=60]`               | Log records for a trace ID          |
| [search-by-route.sh](scripts/search-by-route.sh) | `<route_path> [minutes=30]`             | Logs for an HTTP route              |
| [search-inngest.sh](scripts/search-inngest.sh)   | `<function_pattern> [minutes=30]`       | Inngest function logs               |
| [trace-spans.sh](scripts/trace-spans.sh)         | `<trace_id> [minutes=60]`               | All spans for a trace ID            |

## Common Queries

### Logs

```sql
-- Error+ logs (severity >= 17)
SELECT * FROM default WHERE severity >= 17 ORDER BY _timestamp DESC

-- Logs for a specific user
SELECT * FROM default WHERE str_match(body, 'user@up.edu.ph')

-- Inngest function logs
SELECT * FROM default WHERE str_match(service_name, 'inngest')

-- Logs with a specific attribute
SELECT * FROM default WHERE match_all('draft_id')
```

### Traces (remember `?type=traces`)

```sql
-- All spans for a trace
SELECT * FROM default WHERE trace_id = '{id}' ORDER BY start_time

-- Slow spans (duration in microseconds)
SELECT * FROM default WHERE duration > 1000000 ORDER BY duration DESC

-- Error spans
SELECT * FROM default WHERE span_status = 'ERROR' ORDER BY start_time DESC

-- Spans for a specific HTTP route
SELECT * FROM default WHERE http_route = '/dashboard' ORDER BY start_time DESC
```

### Noise Filtering

The Inngest dev server polls `/api/inngest` continuously for auto-discovery, generating significant trace/log noise. Exclude it from queries:

```sql
-- Logs: exclude Inngest polling
SELECT * FROM default WHERE NOT str_match(body, '/api/inngest') ...

-- Traces: exclude Inngest polling spans
SELECT * FROM default WHERE http_route != '/api/inngest' ...
```

## Debugging Workflow

Recommended approach — **trace-first**:

1. **Find relevant traces** — use `recent-traces.sh` or filter by time window
2. **Inspect spans** — use `trace-spans.sh {trace_id}` to see the full span tree
3. **Correlate with logs** — use `search-by-trace.sh {trace_id}` to find log records emitted during that trace
4. **Drill into specifics** — compose ad-hoc queries targeting specific fields, services, or error conditions

## Manual Curl Template

```shell
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - 30 * 60 * 1000000 ))

curl -s -u "admin@example.com:password" \
  -X POST "http://localhost:5080/api/default/_search" \
  -H 'Content-Type: application/json' \
  -d @- <<EOF | jq '.hits'
{
  "query": {
    "sql": "SELECT * FROM default WHERE ...",
    "start_time": $START_US,
    "end_time": $NOW_US,
    "from": 0,
    "size": 50
  }
}
EOF
```
