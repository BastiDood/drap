---
name: debug-local-otel
description: >
  Query and inspect traces and correlated logs from the local otel-gui instance
  for debugging. Use when investigating errors, tracing request flows,
  inspecting spans, checking log output, or diagnosing issues in the running
  application.
compatibility: Requires `curl` and `jq` to be installed on the system for manual endpoint inspection.
user-invocable: true
disable-model-invocation: false
---

# Debug Local OpenTelemetry Skill

Query and inspect traces and correlated logs from the local `otel-gui` instance.

**IMPORTANT:** This skill is documentation-only. Use the endpoint references in `references/` to compose targeted `curl` + `jq` commands for the specific debugging scenario.

## Prerequisites

- `pnpm docker:dev` must be running, which starts `otel-gui` at `localhost:4318`
- The app process must export traces to `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`
- Read about the OpenTelemetry conventions used in this project

## Connection

| Property | Value                   |
| -------- | ----------------------- |
| Host     | `http://localhost:4318` |
| Auth     | None                    |

## API References

Use `GET` for local debug reads. `otel-gui` accepts OTLP writes at `/v1/traces` and `/v1/logs`, but debugging should use the read-only API endpoints below.

| Reference                                                          | Endpoint                                     | Use case                               |
| ------------------------------------------------------------------ | -------------------------------------------- | -------------------------------------- |
| [Viewer Config](references/viewer-config.md)                       | `GET /api/config`                            | Check retention and persistence status |
| [Recent Trace Summaries](references/recent-trace-summaries.md)     | `GET /api/traces?limit=N`                    | Find candidate traces                  |
| [Full Trace Detail](references/full-trace-detail.md)               | `GET /api/traces/{traceId}`                  | Inspect spans and trace metadata       |
| [Trace Span Inspection](references/trace-span-inspection.md)       | `GET /api/traces/{traceId}`                  | Extract and filter spans               |
| [Correlated Trace Logs](references/correlated-trace-logs.md)       | `GET /api/traces/{traceId}/logs?limit=N`     | Inspect logs for one trace             |
| [Span-Scoped Logs](references/span-scoped-logs.md)                 | `GET /api/traces/{traceId}/logs?spanId={id}` | Inspect logs for one span              |
| [Service Map Overview](references/service-map-overview.md)         | `GET /api/service-map`                       | Inspect aggregated topology            |
| [Trace-Scoped Service Map](references/trace-scoped-service-map.md) | `GET /api/service-map?traceId={traceId}`     | Inspect topology for a single trace    |
| [Error Trace Triage](references/error-trace-triage.md)             | `GET /api/traces?limit=N`                    | Find traces with error spans           |
| [Route Trace Triage](references/route-trace-triage.md)             | `GET /api/traces/{traceId}`                  | Find route-related spans               |
| [Inngest Trace Triage](references/inngest-trace-triage.md)         | `GET /api/traces/{traceId}`                  | Find Inngest-related spans             |

## Debugging Workflow

Recommended approach:

1. **Find relevant traces** - start with the recent trace summaries reference, then use the error, route, or Inngest triage references as needed.
2. **Inspect spans** - use the full trace detail endpoint to see the full span tree.
3. **Correlate with logs** - use the trace logs endpoint to find log records emitted during that trace.
4. **Inspect topology** - use the service map endpoints when cross-service calls are unclear.

Use `jq -c` compact output to minimize context usage. Use `jq -c '.[]'` to stream individual records.
