# Span-Scoped Logs

Fetch logs associated with one span inside one trace. Use `limit` to cap returned log records.

```http
GET /api/traces/{traceId}/logs?spanId={spanId}&limit=100 HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "log-record-id",
    "traceId": "trace-id",
    "spanId": "span-id",
    "severityText": "INFO",
    "body": "log message"
  }
]
```
